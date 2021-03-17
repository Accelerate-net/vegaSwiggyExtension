/*
    POPUP FUNCTIONS
*/

document.addEventListener('DOMContentLoaded', function() {

        var default_ip = '127.0.0.1';
        var default_port = '5984';
        var default_username = 'admin';
        var default_password = 'admin';
        var default_autoEnabled = 'false';


        chrome.storage.local.get(['newServerData'], function(result) {
            
            if(result.newServerData){
                var saved_url = JSON.parse(decodeURI(result.newServerData));

                document.getElementById("serverDataIP").value = saved_url.ip;
                document.getElementById("serverDataPort").value = saved_url.portNumber;
                document.getElementById("serverDataUsername").value = saved_url.username;
                document.getElementById("serverDataPassword").value = saved_url.password;
                document.getElementById("autoEnabled").value = saved_url.autoEnabled;
            }
            else{
                document.getElementById("serverDataIP").value = default_ip;
                document.getElementById("serverDataPort").value = default_port;
                document.getElementById("serverDataUsername").value = default_username;
                document.getElementById("serverDataPassword").value = default_password;
                document.getElementById("autoEnabled").value = default_autoEnabled;
            }
        });

        var button = document.getElementById('setServerData');
        button.addEventListener('click', function () {
          
            var server_ip = document.getElementById("serverDataIP").value;
            var server_port = document.getElementById("serverDataPort").value;
            var server_username = document.getElementById("serverDataUsername").value;
            var server_password = document.getElementById("serverDataPassword").value;
            var autoEnabled = document.getElementById("autoEnabled").value;

            var newServerData = {
                "ip": server_ip,
                "portNumber": server_port,
                "username": server_username,
                "password": server_password,
                "autoEnabled": autoEnabled
            }

            chrome.storage.local.set({'newServerData': encodeURI(JSON.stringify(newServerData))}, function() {
                window.close();
                window.open('http://partner.swiggy.com/orders');
            });
        });
});



/*
    MAIN EXTENSION FUNCTIONS
*/

function initialiseStyleContent(){
    var toastBarContent = document.createElement('div');
    toastBarContent.id = "infobar";

    document.body.appendChild(toastBarContent);
}

initialiseStyleContent();


/* Loading Animation */

var toastShowingInterval;
function showToast(message){
    clearInterval(toastShowingInterval);

    var x = document.getElementById("infobar");
    x.style.background = '#ff9607';
    x.innerHTML = message ? '<tag id="infotext">'+message+'</tag>' : '<tag id="infotext">Loading...</tag>';
    x.className = "show"; 
    x.classList.add('blink_me');
}


function updateToastAndClose(message, color){
    clearInterval(toastShowingInterval);
   
    var x = document.getElementById("infobar");
    x.style.background = color;
    x.innerHTML = message ? message : 'Completing...';
    x.classList.remove('blink_me');

    toastShowingInterval = setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
}

function hideToast(){
  clearInterval(toastShowingInterval);

  var x = document.getElementById("infobar")
  
  toastShowingInterval = setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
}




function hidePunchButton(){
    
    //Hide Punch Button
    document.getElementById("orderAcceptButton").style.display = 'none';

    //Bring back CONFIRM ORDER button
    //document.getElementById("confirm-order").style.display = 'block';
}


//Scrape data for the currently opened order
function scrapeOrderData(){

    return function() {

        hidePunchButton();
        showToast('Processing...');

        // Preparing Order (for Testing)
        //var orderNumberContent = $('.order-details__content #orders-details-prepare .order-details__number .text-yellow');
        
        var orderNumberContent = $('.order-details__content #orders-details-new .order-details__number .text-orange');
        
        var totalItemContent = $('.order-details__content #orders-details-new .order-details__total'); 

        if(orderNumberContent.length < 1 || totalItemContent.length < 1){

            updateToastAndClose('Warning! Valid Order Content not found, Refresh and try again.', '#ff9800');
            
            setTimeout(function(){
                location.reload();
            }, 2000);

            return "";
        }

        /* Order ID */
        var code = orderNumberContent.html();
        code = code.replace("#", "");
        var short_code = code.substring(code.length - 4, code.length);

        /* Total Items */
        var total_items_check = totalItemContent.text();
        total_items_check = total_items_check.trim();
        total_items_check = total_items_check.split(" ");
        total_items_check = parseInt(total_items_check[0]);

        var specialRemarks = $('#specialInstructionNewOrders').html();
        if(specialRemarks == undefined || specialRemarks == null){
            specialRemarks = '';
        }

        var cartListContent = $('.order-details-item-row');
        var cart = [];

        for(var i = 0; i < cartListContent.length; i++){
            
            var item_name = cartListContent[i].getElementsByClassName("order-details__item-name__text")[0].innerText;

            var variantsList = cartListContent[i].getElementsByClassName('order-details__item-variants');
         
            if(variantsList.length > 0){
                var item_variant = variantsList[0].innerText;
                item_variant = item_variant.replace("VARIANTS: ", "");
                item_name = item_name + ' ['+item_variant+']';
            }
        
            var itemQuantityContent = cartListContent[i].getElementsByClassName('order-details__item-quantity')[0];
            var item_quantity = itemQuantityContent.innerText;
            item_quantity = item_quantity.replace("X", "");
            item_quantity = parseInt(item_quantity);

            var item_price = cartListContent[i].getElementsByClassName('order-details__item-price')[0].innerText;
            item_price = item_price.replace("₹", "");
            item_price = item_price.trim();
            item_price = parseInt(item_price);
            item_price = item_price / item_quantity;     


            cart.push({
                name : item_name,
                quantity : item_quantity,
                price : item_price
            });


            if(i == cartListContent.length - 1){
                formatOrderObject();
                break;
            }
        }


        function formatOrderObject(){

            var tapOrderMetaData = {
                "source": "SWIGGY",
                "type": "PARCEL"
            }

            var orderData = {
                  "_id": 'SWIGGY_'+code,
                  "tapsSource": tapOrderMetaData,
                  "KOTNumber": "",
                  "orderDetails": {
                    "mode": "",
                    "modeType": "",
                    "reference": code,
                    "isOnline": true
                  },
                  "table": short_code,
                  "customerName": "Swiggy #"+short_code,
                  "customerMobile": "",
                  "guestCount": 0,
                  "machineName": "Swiggy Extension",
                  "sessionName": "",
                  "stewardName": "",
                  "stewardCode": "",
                  "date": "",
                  "timePunch": "",
                  "timeKOT": "",
                  "timeBill": "",
                  "timeSettle": "",
                  "cart": cart,
                  "specialRemarks": specialRemarks,
                  "allergyInfo": "",
                  "extras": [],
                  "discount": {},
                  "customExtras": {}
            }

            postOrderData(orderData, total_items_check);
        }

    };

}


function postOrderData(orderData, total_items){

        if(orderData.cart.length != total_items){
            updateToastAndClose('Error: Punching failed, Refresh and try again.', '#f44336');
            
            setTimeout(function(){
                location.reload();
            }, 3000);

            return "";
        }
        

        let COMMON_LOCAL_SERVER_IP = '';

        chrome.storage.local.get(['newServerData'], function(result) {
            
            var default_url = 'http://admin:admin@127.0.0.1:5984/';

            if(result.newServerData){
                var userURL = JSON.parse(decodeURI(result.newServerData));
                
                if(userURL.ip != '' && userURL.portNumber != ''){
                    if(userURL.username != '' && userURL.password != ''){
                      COMMON_LOCAL_SERVER_IP = 'http://'+userURL.username+':'+userURL.password+'@'+userURL.ip+':'+userURL.portNumber+'/';
                    }
                    else{
                      COMMON_LOCAL_SERVER_IP = 'http://'+userURL.ip+':'+userURL.portNumber+'/';
                    }
                }
                else{
                    COMMON_LOCAL_SERVER_IP = default_url;
                    showToast('Extension Warning: Add valid Server Credentials', '#e74c3c');
                }
            }
            else{
                COMMON_LOCAL_SERVER_IP = default_url;
                showToast('Extension Warning: Add valid Server Credentials', '#e74c3c');
            }


            //post to server
            var http = new XMLHttpRequest();   
            var url = COMMON_LOCAL_SERVER_IP+'/accelerate_third_party_orders';
            http.open("POST", url);
            http.setRequestHeader("Content-Type", "application/json");

            http.onreadystatechange = function() {
                if(http.status == 201) {
                    updateToastAndClose('Order has been posted Successfully!', '#08cc8c');
                
                    $('#confirm-order').click();
                    setTimeout(function(){
                        location.reload();
                    }, 2000);

                }
                else if(http.status == 409){
                    updateToastAndClose('Aborted! This Order was punched already', '#3498db');
                }
                else if(http.status == 404){
                    updateToastAndClose('System Error: Server connection failed', '#f44336');
                }
                else{
                    updateToastAndClose('Error: Punching order failed', '#f44336');
                }
            }

            http.send(JSON.stringify(orderData));  

        });
}


function bindOrderViewButtons(){
    
    return function() {
        //Temporarily remove CONFIRM ORDER button
        //document.getElementById("confirm-order").style.display = 'none';
        document.getElementById('orderAcceptButton').style.display = 'block';
    };
   
}


function bindPunchButton() {

        //Inject Punch Button
        var swiggy_header = document.getElementsByClassName('orders__header'); 
        var swiggy_header_li_content = swiggy_header[0].getElementsByClassName('row');

        var buttonCollection = swiggy_header_li_content[0].getElementsByClassName("orderAcceptButtonClass");
        if(buttonCollection.length == 0){
            var accept_button_template = document.createElement('button');
            accept_button_template.id = "orderAcceptButton";
            accept_button_template.classList.add("orderAcceptButtonClass");
            accept_button_template.innerHTML = "Punch Order";

            //Change button color if auto punch enabled
            chrome.storage.local.get(['newServerData'], function(result) {
                if(result.newServerData){
                    var userSettings = JSON.parse(decodeURI(result.newServerData));
                    if(userSettings.autoEnabled && userSettings.autoEnabled == "true"){
                        accept_button_template.classList.add("orderAcceptButtonClassAuto");
                        accept_button_template.classList.remove("orderAcceptButtonClass");
                        accept_button_template.innerHTML = "Auto Punching";
                    }
                }
            });            
            

            swiggy_header_li_content[0].appendChild(accept_button_template);
        }

        document.getElementById('orderAcceptButton').addEventListener('click', scrapeOrderData());
}

bindPunchButton();


//Automate
var globalTimer = 0;
let COUNTER_BASE_TIME = 2;
let COUNT_EVERY_SECONDS = 5;
setInterval(function(){
    globalTimer++;

    if(globalTimer > COUNTER_BASE_TIME){
        let timeleft = globalTimer - COUNTER_BASE_TIME;
        timeleft = COUNT_EVERY_SECONDS - timeleft + 1;
        chrome.storage.local.get(['newServerData'], function(result) {
            if(result.newServerData){
                var userSettings = JSON.parse(decodeURI(result.newServerData));
                if(userSettings.autoEnabled && userSettings.autoEnabled == "true"){
                    var buttonCollection = document.getElementsByClassName("orderAcceptButtonClassAuto")[0];
                    if(timeleft > 1){
                        buttonCollection.innerHTML = "Punching Order in " + (timeleft - 1) + " sec";
                    }
                    else{
                        buttonCollection.innerHTML = "Auto Punching";
                        buttonCollection.click();
                    }

                }
            }
        });       
    }

    if(globalTimer == COUNTER_BASE_TIME + COUNT_EVERY_SECONDS){
        globalTimer = 0;
    }
    
}, 1000);
