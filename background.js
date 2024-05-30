chrome.runtime.onInstalled.addListener(() => {
    console.log('Naga Nose installed');
});

const url_base =  "https://api.blackdesertmarket.com" // API to request
const interval = 30 // Number of seconds between each check
let items = []

// Method to add/update the item's informations
function updItemCount(data, enhan_lvl){
    enhan_lvl = typeof enhan_lvl === "number" ? enhan_lvl : parseInt(enhan_lvl);
    const data_id = data.data[enhan_lvl].id;
    const data_enhancement = data.data[enhan_lvl].enhancement;
    const data_name = data.data[enhan_lvl].name;
    const data_count = data.data[enhan_lvl].count;
    const data_tradeCount = data.data[enhan_lvl].tradeCount;
    const data_totalCount = data_count + data_tradeCount;

    const index = items.findIndex(item => item.id === data_id && item.enhan_lvl === data_enhancement);

    if(index!==-1){
        //upd
        if(items[index].totalCount !== data_totalCount){
            const need_notify = items[index].totalCount < data_totalCount ? true : false;

            items[index].count = data_count;
            items[index].tradeCount = data_tradeCount;
            items[index].totalCount = data_totalCount;
            
            if(need_notify){
                notify(items[index])
            }
        }
    }else{
        //add
        const new_item = {
            id : data_id,
            enhan_lvl : data_enhancement,
            name : data_name,
            count : data_count,
            tradeCount : data_tradeCount,
            totalCount : data_totalCount,
        }

        items.push(new_item)
    }
}

// Method to notify
function notify(item) {
    const enhancement = item.enhan_lvl==0 ? '' : `+${item.enhan_lvl} `;
    // const date_inc = new Date(unix_timestamp);
    // const date_string = `${date_inc.getFullYear()}-${date_inc.getMonth()+1}-${date_inc.getDate()} ${date_inc.getHours()}:${date_inc.getMinutes()}`

    chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'psst psst...',
    message: `${enhancement}${item.name} got listed.`,
    priority: 2
    });
}

// Method fetching the data
function fetchData(url = "", enhan_lvl) {
    fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        })  
        .then(response => response.json())
        .then(data => {
            switch(data.code){
                case "SUCCESS":
                    updItemCount(data, enhan_lvl);
                    break;
                
                default:
                    console.log(data.messages[0]);
                    break;
            }   
        })
        .catch(error => console.error('Error fetching data:', error));
}

// Method that trigger the fetching of the data
function initFetchingData(){
    chrome.storage.sync.get(['isSleeping'], function(result) {
        if(!result.isSleeping){
            let data_to_fetch = {
                "items": [],
            }
            chrome.storage.sync.get(['item_list'], function(result) {
                if (result.item_list) {
                    data_to_fetch = result.item_list;
                }
        
                for(const el of data_to_fetch.items){
                    let url = `${url_base}/item/${el.id}?region=eu`;
                    fetchData(url, el.enhan_lvl);
                }
            });
        }
    });
    

};

// Initial call
initFetchingData();

// Repeat it every x second
setInterval(() => {initFetchingData();}, interval*1000);

// KeepAlive
chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create('keepAlive', { periodInMinutes: 1 });
});

chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'keepAlive') {
        console.log("wake up naga !!");
        // Perform necessary actions to keep the worker active
    }
});
