document.addEventListener('DOMContentLoaded', function() {
  console.log('Naga Nose loaded');  

  const url_base = 'https://api.blackdesertmarket.com'
  const isSleeping_switch = document.getElementById('isSleeping');
  const item_form = document.getElementById('item_form');
  const status = document.getElementById('status');
  const search_btn = document.getElementById('search_btn');
  const search_item_name = document.getElementById('search_item_name');
  let item_list = {
    "items" : []
  };

  // Function to change pages
  function changePage(pageName) {
    // Hide all sections
    document.querySelectorAll('section').forEach(section => {
      section.classList.remove('active');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(pageName).classList.add('active');
    
    // Highlight active nav button
    if (pageName !== 'page3') {
      document.querySelector(`[data-page="${pageName}"]`).classList.add('active');
    }
  }

  // Navigation menu event listeners
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      changePage(this.dataset.page);
    });
  });

  // Back button from page 3 to page 2
  document.getElementById('back_to_search').addEventListener('click', function() {
    changePage('page2');
  });

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
      addItem(item_id, item_enhan_lvl, true);
    }else{
      delItem(item_id, item_enhan_lvl, true);
    };

  });

  // Search button event listener
  search_btn.addEventListener('click', async function(event) {
    event.preventDefault();
    const searchTerm = search_item_name.value.trim();
    if(searchTerm){
      const results = await searchItemName(searchTerm);
      showItemListSearch(results);
    }
  });

  // Allow Enter key in search input
  search_item_name.addEventListener('keypress', function(event) {
    if(event.key === 'Enter'){
      search_btn.click();
    }
  });

  // Method to add item to the list
  async function addItem(id, enhan_lvl, returnToPage1 = false){
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
        if(returnToPage1){
          setTimeout(() => {
            changePage('page1');
            document.getElementById('item_form').reset();
          }, 2000);
        }
      });
    } else {
      status.textContent = 'Item not Found.';
      setTimeout(() => {
        status.textContent = '';
      }, 2000); 
    }
  };

  // Method to delete item from the list
  function delItem(id, enhan_lvl, returnToPage1 = false){
    let index = item_list.items.findIndex(item => item.id === id && item.enhan_lvl === enhan_lvl);

    if(index !== -1){
      item_list.items.splice(index, 1);

      chrome.storage.sync.set({ item_list: item_list }, function() {
        status.textContent = 'Item deleted.';
        updItemListP();
        setTimeout(() => {
          status.textContent = '';
        }, 2000);
        if(returnToPage1){
          setTimeout(() => {
            changePage('page1');
            document.getElementById('item_form').reset();
          }, 2000);
        }
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
      const item_container = document.createElement('div');
      item_container.style.display = 'flex';
      item_container.style.alignItems = 'center';
      item_container.style.justifyContent = 'space-between';
      item_container.style.padding = '5px';
      
      const new_span = document.createElement('span');
      const lvl = el.enhan_lvl != 0 ? `+${el.enhan_lvl}` : '';
      new_span.textContent = `- ${lvl} ${el.name}`;
      new_span.title = `ID: ${el.id} | lvl: ${el.enhan_lvl}`;

      const delete_btn = document.createElement('button');
      delete_btn.textContent = '✕';
      delete_btn.innerHTML = '&times;';
      delete_btn.style.background = 'none';
      delete_btn.style.border = 'none';
      delete_btn.style.cursor = 'pointer';
      delete_btn.style.fontSize = '18px';
      delete_btn.style.color = '#999';
      delete_btn.style.padding = '0 5px';
      
      let deleteConfirm = false;
      
      delete_btn.addEventListener('click', function(e) {
        e.preventDefault();
        if(!deleteConfirm) {
          delete_btn.textContent = 'Delete?';
          delete_btn.style.color = '#ff0000';
          deleteConfirm = true;
          
          // Reset after 3 seconds if not confirmed
          setTimeout(() => {
            if(deleteConfirm) {
              delete_btn.textContent = '✕';
              delete_btn.style.color = '#999';
              deleteConfirm = false;
            }
          }, 3000);
        } else {
          delItem(el.id, el.enhan_lvl);
        }
      });
      
      item_container.appendChild(new_span);
      item_container.appendChild(delete_btn);
      
      item_list_p.appendChild(item_container);
      item_list_p.appendChild(document.createElement('br'));
    }
  };

  // Method to get the item name
  async function getItemName(id, enhan_lvl){
    const url = `${url_base}/item/${id}?region=eu`;
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

  async function searchItemName(name){
    const url = `${url_base}/search/${name}?region=eu`;
    let list = false;
    await fetch(url, {
      method: "GET",
      headers: {
          "Content-Type": "application/json",
      },
      })  
      .then(response => response.json())
      .then(data => {
          console.log(data)
          switch(data.code){
              case "SUCCESS":
                list = data.data;
                break;

              default:
                break;
          }   
      })
      .catch(error => console.error('Error fetching data:', error));
    return list;
  };

  function showItemListSearch(list){
    const search_item_list = document.getElementById('search_item_list');

    while (search_item_list.firstChild) {
      search_item_list.removeChild(search_item_list.firstChild);
    }

    if(list && list.length > 0){
      for(const el of list){
        const new_span = document.createElement('span');
        new_span.textContent = `- ${el.name}`;
        new_span.title = `ID: ${el.id} | Grade: ${el.grade} | Price: ${el.basePrice}`;
        new_span.style.cursor = 'pointer';

        new_span.addEventListener('click', function(){
          console.log(`Item clicked - ID: ${el.id}, Name: ${el.name}`);
          // Fill the form and go to page 3
          document.getElementById('item_name').value = el.name;
          document.getElementById('item_id').value = el.id;
          document.getElementById('item_enhan_lvl').value = 0;
          document.getElementById('item_add_del').checked = false;
          changePage('page3');
        });

        console.log(new_span)
        search_item_list.appendChild(new_span);
        search_item_list.appendChild(document.createElement('br'));
      }
    }
  }

});