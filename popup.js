document.addEventListener('DOMContentLoaded', function() {
  console.log('Naga Nose loaded');  

  const isSleeping_switch = document.getElementById('isSleeping');
  const item_form = document.getElementById('item_form');
  const status = document.getElementById('status');
  let item_list = {
    "items" : []
  };

  // Storage sync to get the item list
  chrome.storage.sync.get(['item_list'], function(result) {
    if (result.item_list) {
      item_list = result.item_list;
    }
    updItemListP();
  });

  // Storage sync to get isSleeping state
  chrome.storage.sync.get(['isSleeping'], function(result) {
    document.getElementById("isSleeping").checked = result.isSleeping;
  });

  // Method to update isSleeping state
  isSleeping_switch.addEventListener('change', function(event){
    event.preventDefault();
    const isSleeping = document.getElementById('isSleeping').checked;
    chrome.storage.sync.set({ isSleeping: isSleeping }, function() {
      console.log(`Naga isSleeping switched to : ${isSleeping}`);
    });
  });

  // Method to submit the form
  item_form.addEventListener('submit', function(event) {
    event.preventDefault();
    const item_id = document.getElementById('item_id').value;
    const item_enhan_lvl = document.getElementById('item_enhan_lvl').value ? document.getElementById('item_enhan_lvl').value : 0;
    const item_add_del = document.getElementById('item_add_del').checked;
    if(!item_add_del){
      addItem(item_id, item_enhan_lvl);
    }else{
      delItem(item_id, item_enhan_lvl);
    };

  });

  // Method to add item to the list
  async function addItem(id, enhan_lvl){
    const item_name = await getItemName(id, enhan_lvl);
    if(item_name){
      const new_item = {
        "id"  : id,
        "enhan_lvl" : enhan_lvl,
        "name" : item_name
      };
      item_list.items.push(new_item);

      chrome.storage.sync.set({ item_list: item_list }, function() {
        status.textContent = 'Item added.';
        updItemListP();
        setTimeout(() => {
          status.textContent = '';
        }, 2000); 
      });
    } else {
      status.textContent = 'Item not Found.';
      setTimeout(() => {
        status.textContent = '';
      }, 2000); 
    }
  };

  // Method to delete item from the list
  function delItem(id, enhan_lvl){
    let index = item_list.items.findIndex(item => item.id === id && item.enhan_lvl === enhan_lvl);

    if(index !== -1){
      item_list.items.splice(index, 1);

      chrome.storage.sync.set({ item_list: item_list }, function() {
        status.textContent = 'Item deleted.';
        updItemListP();
        setTimeout(() => {
          status.textContent = '';
        }, 2000); 
      });
    }else{
      status.textContent = 'Item not found.';
      setTimeout(() => {
        status.textContent = '';
      }, 2000); 
    }
  };

  // Method to create the DOM item's list
  function updItemListP(){
    const item_list_p = document.getElementById('current_item_list');

    while (item_list_p.firstChild) {
      item_list_p.removeChild(item_list_p.firstChild);
    }

    for(const el of item_list.items){
      const new_span = document.createElement('span');
      const lvl = el.enhan_lvl != 0 ? `+${el.enhan_lvl}` : '';
      new_span.textContent = `- ${lvl} ${el.name}`;
      new_span.title = `ID: ${el.id} | lvl: ${el.enhan_lvl}`;

      item_list_p.appendChild(new_span);
      item_list_p.appendChild(document.createElement('br'));
    }
  };

  // Method to get the item name
  async function getItemName(id, enhan_lvl){
    const url = `https://api.blackdesertmarket.com/item/${id}?region=eu`;
    let name = false;
    await fetch(url, {
      method: "GET",
      headers: {
          "Content-Type": "application/json",
      },
      })  
      .then(response => response.json())
      .then(data => {
          switch(data.code){
              case "SUCCESS":
                name = data.data[enhan_lvl].name;
                break;

              default:
                break;
          }   
      })
      .catch(error => console.error('Error fetching data:', error));

    return name;
  };

});