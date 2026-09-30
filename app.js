const SUPABASE_URL =
"https://ioswhqeafyfpagczbugz.supabase.co";

const SUPABASE_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvc3docWVhZnlmcGFnY3pidWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2ODcyMjYsImV4cCI6MjEwNjI2MzIyNn0.25zm2okAbcfTzdw83NDjN3cbBJeG8VofNrOSRrlcLdQ";

const supabaseClient =
supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let selectedItemIds = [];

let allItems = [];

let selectedCategories = [];

let selectedTypes = [];

/* ==============================
   LOAD ITEMS
============================== */

async function loadItems() {

    const { data, error } =
    await supabaseClient
        .from("items")
        .select("*")
        .eq("available", true);

    if (error) {

        console.error(error);

        document.getElementById("items").innerHTML =
            "Unable to load items.";

        return;
    }

    allItems = data;

    populateCategories();

    populateItemTypes();

    renderItems(allItems);
}

/* ==============================
   CATEGORY DROPDOWN
============================== */

function populateCategories(){

    const categories =
    [...new Set(
        allItems
            .map(x => x.category)
            .filter(Boolean)
    )]
    .sort();

    let html = "";

    categories.forEach(category => {

        html += `
        <div
            class="filter-chip"
            onclick="toggleCategory('${category}')">

            ${category}

        </div>
        `;
    });

    document
        .getElementById(
            "categoryChips"
        )
        .innerHTML = html;
}

function toggleCategory(category)

{

    if(
      selectedCategories.includes(
        category
      )
    ){

        selectedCategories =
        selectedCategories.filter(
            x => x !== category
        );

    }else{

        selectedCategories.push(
            category
        );
    }

    updateChipStyles();

    populateItemTypes();

    applyFilters();
}

function populateItemTypes()
{

    let sourceItems =
    [...allItems];

    if(
       selectedCategories.length > 0
    ){

        sourceItems =
        sourceItems.filter(
            x =>
            selectedCategories.includes(
                x.category
            )
        );
    }

    const types =
    [...new Set(
        sourceItems.map(
            x => x.item_type
        )
    )]
    .sort();

    let html = "";

    types.forEach(type => {

        html += `
        <div
            class="filter-chip"
            onclick="toggleType('${type}')">

            ${type}

        </div>
        `;
    });

    document
        .getElementById(
            "itemTypeChips"
        )
        .innerHTML = html;
}

function toggleType(type)
{

    if(
      selectedTypes.includes(type)
    ){

        selectedTypes =
        selectedTypes.filter(
          x => x !== type
        );

    }else{

        selectedTypes.push(type);
    }

    updateChipStyles();

    applyFilters();
}

function updateChipStyles(){

    document
        .querySelectorAll(
            ".filter-chip"
        )
        .forEach(chip => {

            chip.classList.remove(
                "active"
            );

            const value =
            chip.innerText.trim();

            if(
                selectedCategories.includes(
                    value
                )
                ||
                selectedTypes.includes(
                    value
                )
            ){

                chip.classList.add(
                    "active"
                );
            }
        });
}

/* ==============================
   RENDER ITEMS
============================== */

function renderItems(items){

    let html = "";

    items.forEach(item => {

        html += `
        <div class="item-row">

            <label>

                <input
            type="checkbox"
            value="${item.id}"
            ${selectedItemIds.includes(item.id) ? 'checked' : ''}
            onchange="toggleSelection('${item.id}')">
            
                <div class="item-details">

                    <div class="item-name">
                        ${item.item_name}
                    </div>

                    <div class="item-meta">
                        ${item.category}
                        •
                        ${item.item_type}
                    </div>

                    <div class="item-qty">
                        Qty Per Thaal:
                        ${item.qty_per_thaal}
                    </div>

                </div>

            </label>

        </div>
        `;
    });

    document
        .getElementById("items")
        .innerHTML = html;
}

/* ==============================
   FILTERING
============================== */

function applyFilters(){

    const search =
    document
      .getElementById(
         "searchBox"
      )
      .value
      .toLowerCase();

    let filtered =
    [...allItems];

    if(
      selectedCategories.length > 0
    ){

        filtered =
        filtered.filter(
            x =>
            selectedCategories.includes(
                x.category
            )
        );
    }

    if(
      selectedTypes.length > 0
    ){

        filtered =
        filtered.filter(
            x =>
            selectedTypes.includes(
                x.item_type
            )
        );
    }

    if(search){

        filtered =
        filtered.filter(
            x =>
            x.item_name
             .toLowerCase()
             .includes(search)
        );
    }

    renderItems(filtered);
}

/* ==============================
   SUBMIT FORM
============================== */

async function submitForm() {

    const selectedItems =
    [
        ...document.querySelectorAll(
            '#items input[type="checkbox"\]:checked'
        )
    ];

    if (selectedItems.length === 0) {

        alert(
            "Please select at least one item."
        );

        return;
    }

    const name =
    document
        .getElementById("name")
        .value
        .trim();

    const phone =
    document
        .getElementById("phone")
        .value
        .trim();

    const email =
    document
        .getElementById("email")
        .value
        .trim();

    const additional =
    document
        .getElementById("additional")
        .value
        .trim();

    if (!name) {

        alert(
            "Please enter your name."
        );

        return;
    }

    /* PHONE VALIDATION */

    const phoneRegex =
    /^(?:\+61|0)4\d{8}$/;

    if (!phoneRegex.test(phone)) {

        alert(
            "Please enter a valid Australian mobile number."
        );

        return;
    }

    /* EMAIL VALIDATION */

    const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {

        alert(
            "Please enter a valid email address."
        );

        return;
    }

    /* DUPLICATE DETECTION */

    const { data: existing } =
    await supabaseClient
        .from("allocation_report")
        .select("*")
        .or(
            `phone.eq.${phone},email.eq.${email}`
        );

    if (existing.length > 0) {

        const proceed =
        confirm(
            "A previous submission already exists using this phone number or email address.\n\nIs this another submission by the same person?"
        );

        if (!proceed) {
            return;
        }
    }

    /* SAVE ITEMS */

    for (const selectedItem of selectedItems) {

        const itemId =
        selectedItem.value;

        const { data: itemData } =
        await supabaseClient
            .from("items")
            .select("*")
            .eq("id", itemId)
            .single();

        await supabaseClient
            .from("allocation_report")
            .insert({
                full_name: name,
                phone: phone,
                email: email,
                item_name: itemData.item_name,
                item_type: itemData.item_type,
                qty_per_thaal:
                    itemData.qty_per_thaal
            });

        await supabaseClient
            .from("items")
            .update({
                available: false
            })
            .eq("id", itemId);
    }

    /* SAVE ADDITIONAL ITEM */

    if (additional) {

        await supabaseClient
            .from("allocation_report")
            .insert({
                full_name: name,
                phone: phone,
                email: email,
                item_name: additional,
                item_type: "Additional Item",
                qty_per_thaal: ""
            });
    }

    alert(
        "Jai Swaminarayan\n\nThank you for offering Annakut Seva."
    );

    location.reload();
}

/* ==============================
   START APP
============================== */

loadItems();

function updateSelectedItems(){

    const selected =
    [
      ...document.querySelectorAll(
      '#items input[type="checkbox"\]:checked'
      )
    ];

    if(selected.length === 0){

        document
          .getElementById(
             "selectedItems"
          )
          .innerHTML =
          "None Selected";

        return;
    }

    let html = "";

    selected.forEach(item => {

        const row =
        item.closest(".item-row");

        const name =
        row.querySelector(
          ".item-name"
        ).innerText;

        html += `
        ✓ ${name}<br>
        `;
    });

    document
       .getElementById(
          "selectedItems"
       )
       .innerHTML = html;
}
