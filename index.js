const API = (() => {
  const URL = "http://localhost:3000";
  
  const getCart = () => {
    // define your method to get cart data
    return fetch(`${URL}/cart`).then((data) => data.json());
  };

  
  const getInventory = () => {
    // define your method to get inventory data
    return fetch(`${URL}/inventory`).then((data) => data.json());
  };

  
  const addToCart = (inventoryItem) => {
    // define your method to add an item to cart
    return fetch(`${URL}/cart`, {
      method: "POST" ,
      headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify(inventoryItem),
        }).then((res) => res.json());
  };
  
  const updateCart = (id, newAmount) => {
    // define your method to update an item in cart
    return fetch(`${URL}/cart/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: newAmount }),
        }).then((res) => res.json());
  };

  
  const deleteFromCart = (id) => {
    // define your method to delete an item in cart
    return fetch(`${URL}/cart/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        },
        }).then((res) => res.json());
  };

  
  const checkout = () => {
    // you don't need to add anything here
    return getCart().then((data) =>
      Promise.all(data.map((item) => deleteFromCart(item.id)))
    );
  };

  const updateInventory = (id, data) => {
    return fetch(URL + "/inventory/" + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  };

  
  return {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
    updateInventory,
  };
})();


const Model = (() => {
  // implement your logic for Model
  class State {
    #onChange;
    #inventory;
    #cart;
    constructor() {
      this.#inventory = [];
      this.#cart = [];
    }
    get cart() {
      return this.#cart;
    }

    get inventory() {
      return this.#inventory;
    }

    set cart(newCart) {
      this.#cart = newCart;
      this.#onChange();
    }
    set inventory(newInventory) {
      this.#inventory = newInventory;
      this.#onChange();
    }

    subscribe(cb) {
      this.#onChange = cb;
    }
  }
  const {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
    updateInventory,
  } = API;
  return {
    State,
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
    updateInventory,
  };
})();

const View = (() => {
  // implement your logic for View
  const inventoryListEl = document.querySelector(".inventory-container ul");
  const cartListEl = document.querySelector(".cart-wrapper ul");
  const inventoryItem = document.querySelector(".li");
  const checkoutBtn = document.querySelector(".checkout-btn");

  const renderInventory = (inventory) => {
    let inventoryTemp = "";
    console.log({inventory})
    inventory.forEach((item) => {
      const inventoryItemTemp = `
      <li class = "li" id="${item.id}">
      <span>${item.content}</span>
      <button type= "button" id = "decrease" class = "decrease-btn" data-id ="${item.id}">-</button>
      <span id = "amount" class = "amount">${item.amount ?? 0}</span>
      <button type= "button" id = "increase" class = "increase-btn" data-id ="${item.id}">+</button>
      <button type= "button" class = "add-cart-btn" data-id="${item.id}">Add to Cart</button>
      </li>      
      `;
      inventoryTemp += inventoryItemTemp;
  });
  inventoryListEl.innerHTML = inventoryTemp;
  };

  const renderCart = (cart) => {
    let cartTemp = "";
    cart.forEach((item) => {
      const cartItemTemp = `
      <li class = "li" id="${item.id}">
      <span>${item.content}</span>
      <span id = "amount" class = "amount">- quantity : ${item.amount}</span>
      <button type= "button" class = "delete-cart-btn" data-id ="${item.id}">Delete</button>
      </li> 
      `;
      cartTemp += cartItemTemp;
    });
    cartListEl.innerHTML = cartTemp;
   };
  
    return {
      inventoryListEl,
      cartListEl,
      renderInventory,
      renderCart,
      inventoryItem,
      checkoutBtn,
    };
})();

const Controller = ((model, view) => {
  // implement your logic for Controller
  const state = new model.State();

  const init = () => {
    model.getInventory().then((data) => {
      state.inventory = data;
    });
    model.getCart().then((data) => {
      state.cart = data;
    });
  };

  const handleUpdateAmount = () => {
    view.inventoryListEl.addEventListener("click", (event)  => {
      let amountEl = event.target.parentNode.querySelector(".amount");
      let quantity = parseInt(amountEl.innerText);

      let id = parseInt(event.target.dataset.id);
      let tempInventory = [...state.inventory];

      objIndex = state.inventory.findIndex((obj) => obj.id == id);
      const newData = state.inventory.find((item) => item.id === id);

      if(event.target.className === "decrease-btn"){
        if(quantity > 0){
          newData.amount--;
          model.updateInventory(id,newData).then((data) => {
            tempInventory[objIndex] = newData;
            state.inventory = tempInventory;
          });
      }
    } else if (event.target.className === "increase-btn") {
      newData.amount++;
      model.updateInventory(id, newData).then((data) => {
        tempInventory[objIndex] = newData;
        state.inventory = tempInventory;
      });
    } else if(event.target.className === "add-cart-btn") {
      console.log('add to cart')
      let alreadyExists;
      alreadyExists = !!state.cart.find((item) => item.id === id);
      if (!alreadyExists) 
        model.addToCart(newData).then((item) => {
          alreadyExists = !!state.cart.find((item) => item.id === id);
          state.cart = [...state.cart, item];
    });

      else {
        let newItem = state.cart.find((item) => item.id === id);
        newItem.amount += newData.amount;

        let tempCart = [...state.cart];
        let index = state.cart.findIndex((obj) => obj.id == id);

        model.updateCart(id, newItem.amount).then((data) => {
          tempCart[index] = newItem;
          state.cart = tempCart;
        });
      }
    }
  });
};

  const handleDelete = () => {
    view.cartListEl.addEventListener("click", (event) => {
      if (event.target.className === "delete-cart-btn") {
      const delId = parseInt(event.target.parentNode.id);
      model.deleteFromCart(delId).then((data) => {
        state.cart = state.cart.filter((item) => item.id !== delId)
        });
      }
    });  
  };

  const handleCheckout = () => {
    view.checkoutBtn.addEventListener("click", (event) => {
      model.checkout().then((data) => {
        state.cart = [];
        console.log(data);
      });
    });
  };

  const bootstrap = () => {
    init();
    state.subscribe(() => {
      view.renderInventory(state.inventory);
      view.renderCart(state.cart);
    });

    handleUpdateAmount();
    handleDelete();
    handleCheckout();
  };
  return {
    bootstrap,
  };
})(Model, View);

Controller.bootstrap();
