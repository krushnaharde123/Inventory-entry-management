import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, listAll, deleteObject, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-storage.js"; // **CRITICAL: Correct Storage SDK URL and Version**
import { v4 as uuidv4 } from 'https://jspm.dev/uuid';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDXZDJGiNudokW6h04TornneQt5_xtep6Y",
    authDomain: "inventory-management-b330b.firebaseapp.com",
    projectId: "inventory-management-b330b",
    storageBucket: "inventory-management-b330b.firebasestorage.app",
    messagingSenderId: "863294594287",
    appId: "1:863294594287:web:49b1e9567abe0939544f1a",
    measurementId: "G-E7H9J01X63"
};

// Initialize Firebase (Ensure correct order!)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app); // **CRITICAL: Initialize Storage AFTER app**

document.addEventListener('DOMContentLoaded', function () {

    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = 'login.html'; // Redirect to login if not authenticated
        } else {
            // Load files when authenticated
            loadFiles();
        }
    });

    // MCB Entry Page Logic
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
    let allEntries = [];
    let lastEntry = null;

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

    productFamilySelect?.addEventListener('change', updateBreakingCapacityOptions);
    addEntryButton?.addEventListener('click', addEntry);
    previewInventoryFileButton?.addEventListener('click', previewInventoryFile);
    generateInventoryFileButton?.addEventListener('click', generateInventoryFile);

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

    async function addEntry() {
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

        try {
            // Add a new document with a generated id.
            const docRef = await addDoc(collection(db, "mcbEntries"), entry);
            console.log("Document written with ID: ", docRef.id);
            allEntries.push({id: docRef.id, ...entry}); // Store with ID
            lastEntry = {id: docRef.id, ...entry};
            displayLastMcbEntry(); //Update display
             // Reset form fields
            polaritySelect.value = '';
            ratingSelect.value = '';
            productFamilySelect.value = '';
            updateBreakingCapacityOptions();
            quantityInput.value = '';
            locationInput.value = '';
        } catch (e) {
            console.error("Error adding document: ", e);
            alert('Error adding entry to Firestore.');
        }
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
                <td><button class="edit-entry" data-id="${lastEntry.id}">Edit</button></td>
            `;
            entryTableBody.appendChild(row);
        }
    }


    async function displayMcbEntries() {
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
            editEntry(event.target.dataset.id);
        }
    });

    async function editEntry(entryId) {
        if (!entryId) {
            console.warn("No entry ID provided for editing.");
            return;
        }
        try {
            // Retrieve the entry from Firestore
            const entryDoc = allEntries.find(entry => entry.id === entryId);

            if (entryDoc) {
                // Populate the form with the entry's data
                polaritySelect.value = entryDoc.polarity;
                ratingSelect.value = entryDoc.rating;
                productFamilySelect.value = entryDoc.productFamily;
                updateBreakingCapacityOptions();
                breakingCapacitySelect.value = entryDoc.breakingCapacity;
                quantityInput.value = entryDoc.quantity;
                locationInput.value = entryDoc.location;

                // Set the lastEntry to the current entry
                lastEntry = entryDoc;

                displayLastMcbEntry();
            } else {
                console.error("Entry not found in Firestore.");
                alert("Entry not found. Please refresh the page.");
            }
        } catch (error) {
            console.error("Error fetching entry from Firestore:", error);
            alert("Failed to fetch entry for editing.");
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

    async function generateInventoryFile() {
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

        // Create a Blob from the CSV content
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const file = new File([blob], `${fileName}.csv`, { type: 'text/csv' });

        // Upload file to Firebase Storage
        uploadFile(file, 'mcb');
    }

    // Carton Entry Page Logic
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
    let allCartonEntries = [];
    let lastCartonEntry = null;
    let materialData = []; // To store the parsed Excel data
    const MASTER_FILE_KEY = 'masterExcelFile';

    cartonMasterFileInput?.addEventListener('change', handleFileUpload);
    materialNumberInput?.addEventListener('input', handleMaterialNumberInput);
    addCartonEntryButton?.addEventListener('click', addCartonEntry);
    previewCartonFileButton?.addEventListener('click', previewCartonFile);
    saveCartonFileButton?.addEventListener('click', saveCartonFile);

    // Load the excel data from local storage
    window.onload = async function() {
        const storedData = localStorage.getItem(MASTER_FILE_KEY);
        if (storedData) {
            materialData = JSON.parse(storedData);
            populateMaterialList();
        }
    };

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
                localStorage.setItem(MASTER_FILE_KEY, JSON.stringify(materialData));
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


    async function addCartonEntry() {
        const number = materialNumberInput.value;
        const description = materialDescriptionInput.value;
        const quantity = cartonQuantityInput.value;
        const location = locationInput.value;

        if (!description || !number || !quantity || !location) {
            alert('Please fill all fields before adding entry.');
            return;
        }

        const entry = { number, description, quantity, location };

         try {
            // Add a new document with a generated id.
            const docRef = await addDoc(collection(db, "cartonEntries"), entry);
            console.log("Document written with ID: ", docRef.id);
            allCartonEntries.push({id: docRef.id, ...entry}); // Store with ID
            lastCartonEntry = {id: docRef.id, ...entry};
            displayLastCartonEntry(); // Update display
             // Reset form fields
            materialNumberInput.value = '';
            materialDescriptionInput.value = '';
            cartonQuantityInput.value = '';
            cartonLocationInput.value = '';
        } catch (e) {
            console.error("Error adding document: ", e);
            alert('Error adding entry to Firestore.');
        }
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
                <td><button class="edit-carton-entry" data-id="${lastCartonEntry.id}">Edit</button></td>
            `;
            cartonEntryTableBody.appendChild(row);
        }
    }

    async function displayCartonEntries() {
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
            editCartonEntry(event.target.dataset.id);
        }
    });

    async function editCartonEntry(entryId) {
         if (!entryId) {
            console.warn("No entry ID provided for editing.");
            return;
        }
        try {
            // Retrieve the entry from Firestore
            const entryDoc = allCartonEntries.find(entry => entry.id === entryId);

            if (entryDoc) {
                 materialNumberInput.value = entryDoc.number;
                materialDescriptionInput.value = entryDoc.description;
                cartonQuantityInput.value = entryDoc.quantity;
                cartonLocationInput.value = entryDoc.location;

                // Set the lastEntry to the current entry
                lastCartonEntry = entryDoc;

                displayLastCartonEntry();
            } else {
                console.error("Entry not found in Firestore.");
                alert("Entry not found. Please refresh the page.");
            }
        } catch (error) {
            console.error("Error fetching entry from Firestore:", error);
            alert("Failed to fetch entry for editing.");
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

    // Save the Carton file
    async function saveCartonFile() {
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

        // Create a Blob from the CSV content
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const file = new File([blob], `${fileName}.csv`, { type: 'text/csv' });

        // Upload file to Firebase Storage
        uploadFile(file, 'carton');
    }

    // Function to upload file to Firebase Storage
    async function uploadFile(file, type) {
        const user = auth.currentUser;
        if (!user) {
            alert('User not authenticated.');
            return;
        }

        const storageRef = ref(storage, `files/${user.uid}/${type}/${file.name}`);
        try {
            await uploadBytes(storageRef, file);
            console.log('Uploaded a blob or file!');

            // Get the download URL
            const downloadURL = await getDownloadURL(storageRef);

            // Save file metadata to Firestore
            await addDoc(collection(db, 'files'), {
                uid: user.uid,
                name: file.name,
                type: type,
                url: downloadURL,
                createdAt: new Date(),
                storagePath: storageRef.fullPath // Store the full path
            });

            alert('File saved successfully!');
            loadFiles(); // Refresh file list
        } catch (error) {
            console.error('Error uploading file: ', error);
            alert('Error saving file.');
        }
    }

    // Function to load files from Firestore
    async function loadFiles() {
        const user = auth.currentUser;
        if (!user) return;

        const mcbTableBody = document.querySelector('#mcb-tab tbody');
        const cartonTableBody = document.querySelector('#carton-tab tbody');
        if (!mcbTableBody || !cartonTableBody) return;

        // Clear existing lists
        mcbTableBody.innerHTML = '';
        cartonTableBody.innerHTML = '';

        const filesCol = collection(db, 'files');
        const q = query(filesCol, where('uid', '==', user.uid)); // Filter by user ID

        try {
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                const file = doc.data();
                const fileDate = new Date(file.createdAt.seconds * 1000); // Convert seconds to milliseconds
                const formattedDate = fileDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false // Use 24-hour format
                });
                const row = document.createElement('tr');
                row.classList.add('bold');
                row.innerHTML = `
                    <td>${file.name}</td>
                    <td>
                        <a href="${file.url}" download="${file.name}" class="download-file">Download</a>
                        <button class="delete-file" data-id="${doc.id}" data-path="${file.storagePath}" data-type="${file.type}">Delete</button>
                        <span class="file-date">Saved: ${formattedDate}</span>
                    </td>`;

                if (file.type === 'mcb') {
                    mcbTableBody.appendChild(row);
                } else if (file.type === 'carton') {
                    cartonTableBody.appendChild(row);
                }
            });
        } catch (error) {
            console.error('Error getting files: ', error);
            alert('Failed to load files.');
        }
    }

    // Function to delete file from Firebase Storage and Firestore
    async function deleteFile(fileId, filePath, fileType) {
        const user = auth.currentUser;
        if (!user) {
            alert('User not authenticated.');
            return;
        }

        const fileRef = ref(storage, filePath);

        try {
            // Delete from Storage
            await deleteObject(fileRef);

            // Delete metadata from Firestore
            await deleteDoc(doc(db, 'files', fileId));

            alert('File deleted successfully!');
            loadFiles(); // Refresh file list
        } catch (error) {
            console.error('Error deleting file: ', error);
            alert('Error deleting file.');
        }
    }

    // Global event listener for download and delete buttons on Physical Counting page
    document.querySelector('.content')?.addEventListener('click', function (event) {
        if (event.target.classList.contains('delete-file')) {
            const fileId = event.target.dataset.id;
            const filePath = event.target.dataset.path;
            const fileType = event.target.dataset.type;
            deleteFile(fileId, filePath, fileType);
        }
    });

    // Initialize breaking capacity options on page load for MCB Entry
    if (productFamilySelect) {
        updateBreakingCapacityOptions();
    }
     // Function to save MCB entries to localStorage (called from Physical Counting page)
     window.saveMcbEntries = async function () {
        if (allEntries.length === 0) {
            alert('No MCB entries to save.');
            return;
        }

        const fileName = prompt("Please enter the file name:", "inventory");
        if (fileName === null || fileName === "") {
            return;
        }

        const csvHeader = "Polarity,Rating,Product Family,Breaking Capacity,Quantity,Location";
        const csvRows = allEntries.map(entry => `${entry.polarity},${entry.rating},${entry.productFamily},${entry.breakingCapacity},${entry.quantity},${entry.location}`).join('\n');
        const csvContent = `${csvHeader}\n${csvRows}`;

          // Create a Blob from the CSV content
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const file = new File([blob], `${fileName}.csv`, { type: 'text/csv' });

        // Upload file to Firebase Storage
        uploadFile(file, 'mcb');
    };
     // Function to save Carton entries to localStorage (called from Physical Counting page)
     window.saveCartonEntries = async function () {
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

        // Create a Blob from the CSV content
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const file = new File([blob], `${fileName}.csv`, { type: 'text/csv' });

        // Upload file to Firebase Storage
        uploadFile(file, 'carton');
    };
});

import { query, where } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
