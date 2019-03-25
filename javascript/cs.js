var label = document.getElementsByClassName('order-preview ng-scope active');

let data = {
	orderShortCode: null,
	totalItems: null,
	totalAmount: null,
	swiggyCode: null,
	dateStamp: null,
	cart: []
}
let name = ""
let variant = ""
let price = null
let quantity = null

for(var i = 0; i < label.length; i++) {
       label[i].addEventListener("click", bindClick(i));
}

 function bindClick(i) {
    return function() {
    	label = document.getElementsByClassName('order-preview ng-scope active');
    	console.log(label)
    	var totalItemsText = label[i].getElementsByClassName('order-preview__total')[0].innerText
    	var res = totalItemsText.split(" ");
    	var content = document.getElementsByClassName('order-details__content')
    	var code = content[0].getElementsByClassName('order-details__number')[0].getElementsByClassName('text-orange')[0].innerText
    	var food = document.getElementsByClassName('order-details__items')
    	var dateStamp = document.getElementById('print-new-details').innerText
    	
    	for(var j=0;j<food.length;j++){
    		var dat = {
    			name : food[j].getElementsByClassName('order-details__item-name__text')[0].innerText,
	    		variant : food[j].getElementsByClassName('order-details__item-variants')[0] ? food[j].getElementsByClassName('order-details__item-variants')[0].innerText : "",
	    		price : food[j].getElementsByClassName('order-details__item-price')[0].innerText.substring(2),
	    		quantity : food[j].getElementsByClassName('order-details__item-quantity')[0].getElementsByClassName('ng-binding')[0].innerText
    		}
    		data.cart.push(dat)
    	}

    	data.orderShortCode = label[0].getElementsByClassName('order-preview__number')[0].innerText
    	data.totalItems = Number(res[0])
    	data.totalAmount = Number(res[3].substring(1))
    	data.dateStamp = dateStamp
    	data.swiggyCode = Number(code.substring(1))
    	console.log(data)

    	var json = {
              "type":"select",
              "args":{
                      "table":"department",
                      "columns":["*"]
              }
        }

    	var http = new XMLHttpRequest();   
		var url = 'https://data.saarang.org/v1/query';
		http.open("POST", url);
		//http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

		http.onreadystatechange = function() {
		    if(http.readyState == 4 && http.status == 200) {
		        console.log(http.responseText);
		    }
		}
		http.send(JSON.stringify(json));
				
		
    };
 }