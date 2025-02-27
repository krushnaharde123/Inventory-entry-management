import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCu3QPSWVPn4ShOGrWF1V0AAzylEnsrlj0",
    authDomain: "inventory-67dc6.firebaseapp.com",
    projectId: "inventory-67dc6",
    storageBucket: "inventory-67dc6.firebasestorage.app",
    messagingSenderId: "990674251976",
    appId: "1:990674251976:web:4ecf0da10934e45dd4b5fd",
    measurementId: "G-KPBR13NFH6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', function () {
    // Check if user is logged in
    // onAuthStateChanged(auth, (user) => {
    //     if (!user) {
    //         // Redirect to login page if not logged in
    //         window.location.href = "login.html";
    //     }
    // });

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
        allEntries.push(entry);
        lastEntry = entry;
        displayLastMcbEntry(); // Added this line
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

    // Function to display MCB entries
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

    // Save all entries to a single file in Firestore.
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

        try {
            // Get the current user
            // const user = auth.currentUser;
            // if (!user) {
            //     alert('User not logged in.');
            //     return;
            // }

            // Add the file to Firestore
            await addDoc(collection(db, 'mcbFiles'), {
                fileName: `${fileName}.csv`,
                content: csvContent,
                createdAt: new Date(),
                // uid: user.uid // Associate the file with the user  <-- REMOVE THIS LINE
            });

            alert('MCB entries saved to Firestore successfully!');
            allEntries = [];
            displayMcbEntries();
            listFiles('mcb', document.querySelector('#mcb-tab tbody'));
        } catch (error) {
            console.error("Error saving to Firestore:", error);
            alert('Failed to save MCB entries to Firestore: ' + error.message);
        }
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
    window.onload = function() {
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
        allCartonEntries.push(entry);
        lastCartonEntry = entry;
        displayLastCartonEntry();//displayCartonEntries(); // Removed this line

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

    // Save the Carton file in Firestore
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

        try {
            // Get the current user
            // const user = auth.currentUser;
            // if (!user) {
            //     alert('User not logged in.');
            //     return;
            // }

            // Add the file to Firestore
            await addDoc(collection(db, 'cartonFiles'), {
                fileName: `${fileName}.csv`,
                content: csvContent,
                createdAt: new Date(),
                //  uid: user.uid // Associate the file with the user  <-- REMOVE THIS LINE
            });

            alert('Carton entries saved to Firestore successfully!');
            allCartonEntries = [];
            displayCartonEntries();
            listFiles('carton', document.querySelector('#carton-tab tbody'));
        } catch (error) {
            console.error("Error saving to Firestore:", error);
            alert('Failed to save Carton entries to Firestore: ' + error.message);
        }
    }

    // Listing files from Firestore on the Physical Counting page
    async function listFiles(type, tableBody) {
        tableBody.innerHTML = '';
        let files = [];

        try {
            // Get the current user
            // const user = auth.currentUser;
            // if (!user) {
            //     alert('User not logged in.');
            //     return;
            // }

            let querySnapshot;
            if (type === 'mcb') {
                querySnapshot = await getDocs(collection(db, 'mcbFiles'));
            } else if (type === 'carton') {
                querySnapshot = await getDocs(collection(db, 'cartonFiles'));
            }

            querySnapshot.forEach((doc) => {
                // Filter files by user ID
                // if (doc.data().uid === user.uid) {   <-- REMOVE THIS LINE
                    files.push({ id: doc.id, ...doc.data() }); // Store the doc.id()
                // }   <-- REMOVE THIS LINE
            });

            if (!files || files.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="2">No files found.</td></tr>';
                return;
            }

            files.forEach((file, index) => {
                const row = document.createElement('tr');
                row.classList.add('bold');
                const fileDate = new Date(file.createdAt.toDate()); // Convert Firebase Timestamp to JavaScript Date
                const formattedDate = fileDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false // Use 24-hour format
                });

                row.innerHTML = `
                    <td>${file.fileName}</td>
                    <td>
                        <button class="download-file" data-index="${index}" data-type="${type}" data-file-id="${file.id}">Download</button>
                        <button class="delete-file" data-index="${index}" data-type="${type}" data-file-id="${file.id}">Delete</button>
                        <span class="file-date">Saved: ${formattedDate}</span>
                    </td>`;
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error("Error fetching files from Firestore:", error);
            alert('Failed to fetch files from Firestore: ' + error.message);
        }
    }

    // Download file from Firestore
    async function downloadFileLocal(index, type, fileId) {
        try {
            let querySnapshot;
            if (type === 'mcb') {
                querySnapshot = await getDocs(collection(db, 'mcbFiles'));
            } else if (type === 'carton') {
                querySnapshot = await getDocs(collection(db, 'cartonFiles'));
            }

            let file;
             querySnapshot.forEach((doc) => {
                if (doc.id === fileId) {
                    file = { id: doc.id, ...doc.data() }; // Store the doc.id()
                }
            });

            if (file) {
                const downloadLink = document.createElement('a');
                downloadLink.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(file.content));
                downloadLink.setAttribute('download', file.fileName);
                downloadLink.style.display = 'none';
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            }
        } catch (error) {
            console.error("Error downloading file from Firestore:", error);
            alert('Failed to download file from Firestore: ' + error.message);
        }
    }

    // Delete file from Firestore
    async function deleteFileLocal(index, type, fileId) {
        try {
            // Get the current user
            // const user = auth.currentUser;
            // if (!user) {
            //     alert('User not logged in.');
            //     return;
            // }
            if (type === 'mcb') {
                await deleteDoc(doc(db, "mcbFiles", fileId));
            } else if (type === 'carton') {
                await deleteDoc(doc(db, "cartonFiles", fileId));
            }
            alert('File deleted successfully!');
            const tableBody = (type === 'mcb')
                ? document.querySelector('#mcb-tab tbody')
                : document.querySelector('#carton-tab tbody');
            await listFiles(type, tableBody);
        } catch (error) {
            console.error("Error deleting file from Firestore:", error);
            alert('Failed to delete file from Firestore: ' + error.message);
        }
    }

    // Global event listener for download and delete buttons on Physical Counting page
    document.querySelector('.content')?.addEventListener('click', function (event) {
        if (event.target.classList.contains('download-file')) {
            const index = parseInt(event.target.dataset.index);
            const type = event.target.dataset.type;
            const fileId = event.target.dataset.fileId;
            downloadFileLocal(index, type, fileId);
        } else if (event.target.classList.contains('delete-file')) {
            const index = parseInt(event.target.dataset.index);
            const type = event.target.dataset.type;
             const fileId = event.target.dataset.fileId;
            deleteFileLocal(index, type, fileId);
        }
    });

    // Initialize breaking capacity options on page load for MCB Entry
    if (productFamilySelect) {
        updateBreakingCapacityOptions();
    }

    // Load file lists on page load for Physical Counting
    const mcbTab = document.getElementById('mcb-tab');
    const cartonTab = document.getElementById('carton-tab');

    if (mcbTab) {
        const mcbTableBody = mcbTab.querySelector('tbody');
        listFiles('mcb', mcbTableBody);
    }

    if (cartonTab) {
        const cartonTableBody = cartonTab.querySelector('tbody');
        listFiles('carton', cartonTableBody);
    }
     // Function to save MCB entries to Firestore (called from Physical Counting page)
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

        try {
            // Get the current user
            // const user = auth.currentUser;
            // if (!user) {
            //     alert('User not logged in.');
            //     return;
            // }

            // Add the file to Firestore
            await addDoc(collection(db, 'mcbFiles'), {
                fileName: `${fileName}.csv`,
                content: csvContent,
                createdAt: new Date(),
                // uid: user.uid // Associate the file with the user  <-- REMOVE THIS LINE
            });

            alert('MCB entries saved to Firestore successfully!');
            allEntries = [];
            displayMcbEntries();
            listFiles('mcb', document.querySelector('#mcb-tab tbody'));
        } catch (error) {
            console.error("Error saving to Firestore:", error);
            alert('Failed to save MCB entries to Firestore: ' + error.message);
        }
    };
     // Function to save Carton entries to Firestore (called from Physical Counting page)
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

        try {
            // Get the current user
            // const user = auth.currentUser;
            // if (!user) {
            //     alert('User not logged in.');
            //     return;
            // }

            // Add the file to Firestore
            await addDoc(collection(db, 'cartonFiles'), {
                fileName: `${fileName}.csv`,
                content: csvContent,
                createdAt: new Date(),
                //  uid: user.uid // Associate the file with the user  <-- REMOVE THIS LINE
            });

            alert('Carton entries saved to Firestore successfully!');
            allCartonEntries = [];
            displayCartonEntries();
            listFiles('carton', document.querySelector('#carton-tab tbody'));
        } catch (error) {
            console.error("Error saving to Firestore:", error);
            alert('Failed to save Carton entries to Firestore: ' + error.message);
        }
    };
});
