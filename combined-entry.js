document.addEventListener('DOMContentLoaded', function () {
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-analytics.js";
  
  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyDXZDJGiNudokW6h04TornneQt5_xtep6Y",
    authDomain: "inventory-management-b330b.firebaseapp.com",
    projectId: "inventory-management-b330b",
    storageBucket: "inventory-management-b330b.firebasestorage.app",
    messagingSenderId: "863294594287",
    appId: "1:863294594287:web:49b1e9567abe0939544f1a",
    measurementId: "G-E7H9J01X63"
  };

    // Initialize Firebase
    const app = firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();

    // Get references to HTML elements
    const productFamilySelect = document.getElementById('product-family');
    const breakingCapacitySelect = document.getElementById('breaking-capacity');
    const polaritySelect = document.getElementById('polarity');
    const ratingSelect = document.getElementById('rating');
    const quantityInput = document.getElementById('quantity');
    const locationInput = document.getElementById('location');
    const entryTableBody = document.getElementById('entry-table')?.querySelector('tbody');
    const previewInventoryFileButton = document.getElementById('preview-inventory-file');
    const generateInventoryFileButton = document.getElementById('generate-inventory-file');
    const addEntryButton = document.getElementById('add-entry');

     const cartonMasterFileInput = document.getElementById('carton-master-file');
    const materialDescriptionInput = document.getElementById('material-description');
    const materialNumberInput = document.getElementById('material-number');
    const materialList = document.getElementById('material-list');
    const cartonQuantityInput = document.getElementById('carton-quantity');
    const cartonLocationInput = document.getElementById('carton-location');
    const cartonEntryTableBody = document.getElementById('carton-entry-table')?.querySelector('tbody');
    const previewCartonFileButton = document.getElementById('preview-carton-file');
    const saveCartonFileButton = document.getElementById('save-carton-file');
    const addCartonEntryButton = document.getElementById('add-carton-entry');

    let allEntries = [];
    let lastEntry = null;
    let materialData = [];
    let allCartonEntries = [];
    let lastCartonEntry = null;

    // Breaking capacity data
    const breakingCapacityData = {
        '5SL1': ['3KA'],
        '5SJ': ['6KA'],
        'Mexico': ['4.5/6KA'],
        '5SL6': ['7.5KA'],
        '5SL4': ['10KA'],
        'ELSA-2': ['10kA/15kA/20kA'],
        'ELSA-1': ['6KA'],
        '5SL7': ['15KA'],
        'K': ['15KA'],
        'MB': ['7.5KA/10KA'],
        'MB Europe': ['7.5KA/10KA'],
        '5SL7-K': ['15KA']
    };

    // Event listeners
    productFamilySelect?.addEventListener('change', updateBreakingCapacityOptions);
    addEntryButton?.addEventListener('click', addEntry);
    previewInventoryFileButton?.addEventListener('click', previewInventoryFile);
    generateInventoryFileButton?.addEventListener('click', generateInventoryFileLocal);

    cartonMasterFileInput?.addEventListener('change', handleFileUpload);
    materialNumberInput?.addEventListener('input', handleMaterialNumberInput);
    addCartonEntryButton?.addEventListener('click', addCartonEntry);
    previewCartonFileButton?.addEventListener('click', previewCartonFile);
    saveCartonFileButton?.addEventListener('click', saveCartonFileLocal);

    // Functions for MCB Entry
    function updateBreakingCapacityOptions() {
        const selectedFamily = productFamilySelect.value;
        const capacities = breakingCapacityData[selectedFamily] || [];
        breakingCapacitySelect.innerHTML = '';
        capacities.forEach(capacity => {
            const option = document.createElement('option');
            option.value = capacity;
            option.textContent = capacity;
            breakingCapacitySelect.appendChild(option);
        });
    }

    function addEntry() {
        const polarity = polaritySelect.value;
        const rating = ratingSelect.value;
        const productFamily = productFamilySelect.value;
        const breakingCapacity = breakingCapacitySelect.value;
        const quantity = quantityInput.value;
        const location = locationInput.value;

        if (!polarity || !rating || !productFamily || !breakingCapacity || !quantity || !location) {
            alert('Please fill all fields before adding entry.');
            return;
        }

        const entry = { polarity, rating, productFamily, breakingCapacity, quantity, location };
        addEntryToServer(entry);
        // Reset form fields
        polaritySelect.value = '';
        ratingSelect.value = '';
        productFamilySelect.value = '';
        updateBreakingCapacityOptions();
        quantityInput.value = '';
        locationInput.value = '';
    }

    function displayLastMcbEntry() {
        entryTableBody.innerHTML = '';
        if (lastEntry) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${lastEntry.polarity}</td>
                <td>${lastEntry.rating}</td>
                <td>${lastEntry.productFamily}</td>
                <td>${lastEntry.breakingCapacity}</td>
                <td>${lastEntry.quantity}</td>
                <td>${lastEntry.location}</td>
                <td><button class="edit-entry">Edit</button></td>
            `;
            entryTableBody.appendChild(row);
        }
    }

    function displayMcbEntries() {
        entryTableBody.innerHTML = '';
        allEntries.forEach((entry, index) => { // Loop through all entries
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${entry.polarity}</td>
                <td>${entry.rating}</td>
                <td>${entry.productFamily}</td>
                <td>${entry.breakingCapacity}</td>
                <td>${entry.quantity}</td>
                <td>${entry.location}</td>
                <td><button class="edit-entry" data-index="${index}">Edit</button></td>
            `;
            entryTableBody.appendChild(row);
        });
    }

    // Edit entry functionality
    entryTableBody?.addEventListener('click', function(event) {
        if (event.target.classList.contains('edit-entry')) {
            editEntry();
        }
    });

    function editEntry() {
        if (lastEntry) {
            // Populate the form with the last entry's data
            polaritySelect.value = lastEntry.polarity;
            ratingSelect.value = lastEntry.rating;
            productFamilySelect.value = lastEntry.productFamily;
            updateBreakingCapacityOptions();
            breakingCapacitySelect.value = lastEntry.breakingCapacity;
            quantityInput.value = lastEntry.quantity;
            locationInput.value = lastEntry.location;

            displayLastMcbEntry();
        }
    }

    function previewInventoryFile() {
        if (allEntries.length === 0) {
            alert('No entries to preview.');
            return;
        }
        displayMcbEntries(); // Called here to display all entry
        generateInventoryFileButton.style.display = 'inline-block';
    }

    function generateInventoryFileLocal() {
        if (allEntries.length === 0) {
            alert('No entries to generate.');
            return;
        }

        const fileName = prompt("Please enter the file name:", "inventory");
        if (fileName === null || fileName === "") {
            return;
        }

        const csvHeader = "Polarity,Rating,Product Family,Breaking Capacity,Quantity,Location";
        const csvRows = allEntries.map(entry => `${entry.polarity},${entry.rating},${entry.productFamily},${entry.breakingCapacity},${entry.quantity},${entry.location}`).join('\n');
        const csvContent = `${csvHeader}\n${csvRows}`;

        // Save file content in localStorage under "mcbFiles".
        let mcbFiles = JSON.parse(localStorage.getItem('mcbFiles') || '[]');
        const createdAt = new Date().toISOString();
        mcbFiles.push({ fileName: `${fileName}.csv`, content: csvContent, createdAt: createdAt });
        localStorage.setItem('mcbFiles', JSON.stringify(mcbFiles));

        alert('MCB entries saved to local storage successfully!');
        allEntries = [];
        displayMcbEntries();
    }

    // Functions for Carton Entry
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                materialData = XLSX.utils.sheet_to_json(worksheet);
                console.log("Parsed Excel data:", materialData); // Inspect the data
                populateMaterialList();
            };
            reader.readAsArrayBuffer(file);
        }
    }

    function populateMaterialList() {
        materialList.innerHTML = '';
        materialData.forEach(item => {
            const option = document.createElement('option');
            option.value = item['Material number'];
            materialList.appendChild(option);
        });
    }

   function handleMaterialNumberInput() {
        const number = materialNumberInput.value;

        // Define possible keys for material description and number
        const descriptionKey = 'Material description';
        const numberKey = 'Material number';

        const material = materialData.find(item => {
            // Normalize both the input and the material number for comparison
            const normalizedNumber = number.trim().toLowerCase();
            const normalizedMaterialNumber = String(item[numberKey]).trim().toLowerCase(); // Ensure it's a string
            console.log(`Comparing "${normalizedNumber}" with "${normalizedMaterialNumber}"`);

            return normalizedNumber === normalizedMaterialNumber;
        });

        if (material) {
            const materialDescription = material[descriptionKey];
            console.log("Found matching material:", material);
            console.log("Material Description:", materialDescription);

            if (materialDescription !== undefined && materialDescription !== null) {
                materialDescriptionInput.value = materialDescription;
            } else {
                materialDescriptionInput.value = '';
                console.warn("Material description is undefined or null in the data.");
            }
        } else {
            materialDescriptionInput.value = '';
            console.log("No matching material found.");
        }
    }

    function addCartonEntry() {
        const number = materialNumberInput.value;
        const description = materialDescriptionInput.value;
        const quantity = cartonQuantityInput.value;
        const location = cartonLocationInput.value;

        if (!description || !number || !quantity || !location) {
            alert('Please fill all fields before adding entry.');
            return;
        }

        const entry = { number, description, quantity, location };
        addEntryToServer(entry);
        //displayCartonEntries();// Removed this line

        materialNumberInput.value = '';
        materialDescriptionInput.value = '';
        cartonQuantityInput.value = '';
        cartonLocationInput.value = '';
    }

     function displayLastCartonEntry() {
        cartonEntryTableBody.innerHTML = '';
        if (lastCartonEntry) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${lastCartonEntry.number}</td>
                <td>${lastCartonEntry.description}</td>
                <td>${lastCartonEntry.quantity}</td>
                <td>${lastCartonEntry.location}</td>
                <td><button class="edit-carton-entry">Edit</button></td>
            `;
            cartonEntryTableBody.appendChild(row);
        }
    }

    function displayCartonEntries() {
        cartonEntryTableBody.innerHTML = '';
        allCartonEntries.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${entry.number}</td>
                <td>${entry.description}</td>
                <td>${entry.quantity}</td>
                <td>${entry.location}</td>
                <td><button class="edit-carton-entry" data-index="${index}">Edit</button></td>
            `;
            cartonEntryTableBody.appendChild(row);
        });
    }

    // Edit carton entry functionality
    cartonEntryTableBody?.addEventListener('click', function(event) {
        if (event.target.classList.contains('edit-carton-entry')) {
            editCartonEntry();
        }
    });

    function editCartonEntry() {
         if (lastCartonEntry) {
            materialNumberInput.value = lastCartonEntry.number;
            materialDescriptionInput.value = lastCartonEntry.description;
            cartonQuantityInput.value = lastCartonEntry.quantity;
            cartonLocationInput.value = lastCartonEntry.location;

            displayLastCartonEntry();
        }
    }

    function previewCartonFile() {
        if (allCartonEntries.length === 0) {
            alert('No entries to preview.');
            return;
        }
        displayCartonEntries(); // Called here to display all entries
        saveCartonFileButton.style.display = 'inline-block';
    }

    function saveCartonFileLocal() {
        if (allCartonEntries.length === 0) {
            alert('No entries to generate.');
            return;
        }
        const fileName = prompt("Please enter the file name:", "carton");
        if (fileName === null || fileName === "") {
            return;
        }

        const csvHeader = "Material Number,Material Description,Quantity,Location";
        const csvRows = allCartonEntries.map(entry => `${entry.number},${entry.description},${entry.quantity},${entry.location}`).join('\n');
        const csvContent = `${csvHeader}\n${csvRows}`;

        // Save file content in localStorage under "cartonFiles".
        let cartonFiles = JSON.parse(localStorage.getItem('cartonFiles') || '[]');
        const createdAt = new Date().toISOString();
        cartonFiles.push({ fileName: `${fileName}.csv`, content: csvContent, createdAt: createdAt });
        localStorage.setItem('cartonFiles', JSON.stringify(cartonFiles));

        alert('Carton entries saved to local storage successfully!');
        allCartonEntries = [];
        displayCartonEntries();
    }

    // Firebase integration functions
    async function fetchInventory() {
        try {
            const inventoryCollection = db.collection('inventory');
            const snapshot = await inventoryCollection.get();
            allEntries = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            displayMcbEntries();
            displayCartonEntries();
        } catch (error) {
            console.error('Error fetching inventory:', error.message);
            alert('Failed to load inventory data: ' + error.message);
        }
    }

    async function addEntryToServer(entry) {
        try {
            await db.collection('inventory').add(entry);
            await fetchInventory(); // Refresh the inventory table
        } catch (error) {
            console.error('Error adding entry:', error.message);
            alert('Failed to add entry: ' + error.message);
        }
    }

    // Authentication functions
    async function signUp(email, password) {
        try {
            await auth.createUserWithEmailAndPassword(email, password);
            alert('Signup successful!');
            // Optionally, redirect to the inventory page
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Signup error:', error.message);
            alert('Signup failed: ' + error.message);
        }
    }

    async function logIn(email, password) {
        try {
            await auth.signInWithEmailAndPassword(email, password);
            alert('Login successful!');
            // Redirect to the inventory page
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Login error:', error.message);
            alert('Login failed: ' + error.message);
        }
    }

    async function logOut() {
        try {
            await auth.signOut();
            alert('Logout successful!');
            // Redirect to the login page
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout error:', error.message);
            alert('Logout failed: ' + error.message);
        }
    }

    // Authentication state listener
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            console.log('User is signed in:', user.email);
            fetchInventory(); // Load inventory after login
        } else {
            // User is signed out
            console.log('User is signed out');
            // Redirect to the login page only if not already on login page
            if (window.location.pathname !== '/login.html') {
                window.location.href = 'login.html';
            }
        }
    });
});
