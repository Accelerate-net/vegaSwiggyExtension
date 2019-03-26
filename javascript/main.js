/*
    POPUP FUNCTIONS
*/

document.addEventListener('DOMContentLoaded', function() {

        var default_ip = '127.0.0.1';
        var default_port = '5984';
        var default_username = 'admin';
        var default_password = 'admin';


        chrome.storage.local.get(['newServerData'], function(result) {
            
            if(result.newServerData){
                var saved_url = JSON.parse(decodeURI(result.newServerData));

                document.getElementById("serverDataIP").value = saved_url.ip;
                document.getElementById("serverDataPort").value = saved_url.portNumber;
                document.getElementById("serverDataUsername").value = saved_url.username;
                document.getElementById("serverDataPassword").value = saved_url.password;
            }
            else{
                document.getElementById("serverDataIP").value = default_ip;
                document.getElementById("serverDataPort").value = default_port;
                document.getElementById("serverDataUsername").value = default_username;
                document.getElementById("serverDataPassword").value = default_password;
            }
        });

        var button = document.getElementById('setServerData');
        button.addEventListener('click', function () {
          
            var server_ip = document.getElementById("serverDataIP").value;
            var server_port = document.getElementById("serverDataPort").value;
            var server_username = document.getElementById("serverDataUsername").value;
            var server_password = document.getElementById("serverDataPassword").value;

            var newServerData = {
                "ip": server_ip,
                "portNumber": server_port,
                "username": server_username,
                "password": server_password
            }

            chrome.storage.local.set({'newServerData': encodeURI(JSON.stringify(newServerData))}, function() {
              window.close();
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
    document.getElementById("confirm-order").style.display = 'block';
}


//Scrape data for the currently opened order
function scrapeOrderData(){


    return function() {

        hidePunchButton();
        showToast('Processing...');

        var orderNumberContent = $('.order-details__content #orders-details-new .order-details__number .text-orange');
        var code = orderNumberContent.html();
        code = code.replace("#", "");
        var short_code = code.substring(code.length - 4, code.length);

        var specialRemarks = $('#specialInstructionPreparingOrders').html();
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

            var item_price = cartListContent[i].getElementsByClassName('order-details__item-price')[0].innerText.substring(2);
        

            cart.push({
                name : item_name,
                quantity : item_quantity,
                price : item_price
            });


            if(i == cartListContent.length - 1){
                console.log(cart)
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
                  "customerName": "",
                  "customerMobile": "",
                  "guestCount": 0,
                  "machineName": "Swiggy Extension",
                  "sessionName": "",
                  "stewardName": "Swiggy Automatic",
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

            postOrderData(orderData);
        }

    };

}


function postOrderData(orderData){
        
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
            var url = COMMON_LOCAL_SERVER_IP+'/accelerate_taps_orders';
            http.open("POST", url);
            http.setRequestHeader("Content-Type", "application/json");

            http.onreadystatechange = function() {

                if(http.status == 201) {
                    updateToastAndClose('Order has been posted Successfully!', '#08cc8c');
                }
                else if(http.status == 409){
                    updateToastAndClose('Warning! Order is already punched', '#f44336');
                }
                else if(http.status == 404){
                    updateToastAndClose('System Error: Server connection failed', '#f44336');
                }
                else{
                    updateToastAndClose('Error: Punching order failed', '#f44336');
                }

                loadActiveOrders();
            }

            http.send(JSON.stringify(orderData));  

        });
}


function loadActiveOrders(){

    $("#mCSB_3_container").find("*").off();

    var pendingOrdersList = $('#mCSB_3_container .order-preview');

    for(var i = 0; i < pendingOrdersList.length; i++) {
        $(pendingOrdersList[i]).bind("click", bindOrderViewButtons());
    }
}


function bindOrderViewButtons(){
    
    return function() {
        //Temporarily remove CONFIRM ORDER button
        document.getElementById("confirm-order").style.display = 'none';
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

            swiggy_header_li_content[0].appendChild(accept_button_template);
        }

        document.getElementById('orderAcceptButton').addEventListener('click', scrapeOrderData());
}



/* Refresh Page Changes */
setTimeout(function(){ 
   // bindPunchButton();
    loadActiveOrders();
}, 5000);

bindPunchButton();
loadActiveOrders();