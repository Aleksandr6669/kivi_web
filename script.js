document.addEventListener("DOMContentLoaded", async function() {
    // Function to fetch data from the server
    async function getModelList() {
        const proxyUrl = "https://cors-anywhere.herokuapp.com/";
        const targetUrl = "https://tmbot-dev.kivismart.com/api/tv_mfa_inventory?date=2024-10-01&chain=CF";
        const url = proxyUrl + targetUrl;
        // const url = targetUrl;

        try {
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching model list:', error);
            return null;
        }
    }

    try {
        // Fetch the inventory data from the server
        const inventoryApiData = await getModelList();

        // Check if data is fetched successfully
        if (!inventoryApiData) {
            throw new Error('Failed to fetch inventory data');
        }

        // Process the fetched data to match your inventoryData structure
        const inventoryData = {
            stores: inventoryApiData.stores.flat(),
            modelsInHeader: inventoryApiData.modelsInHeader.flat(),
            incomingData: inventoryApiData.incomingData.flat(),
            inventoryDate: inventoryApiData.inventoryDate
        };

        // Form the table headers
        const colHeaders = ['Магазини'];
        inventoryData.modelsInHeader.forEach(group => {
            colHeaders.push(group.join(' / '));
        });
        colHeaders.push('Дата формування: ' + inventoryData.inventoryDate);

        // Prepare the table data
        const tableData = [];
        const stores = inventoryData.stores;

        stores.forEach(store => {
            const row = [store];
            inventoryData.modelsInHeader.forEach(group => {
                let totalQuantity = 0;
                group.forEach(model => {
                    const modelData = inventoryData.incomingData.filter(item => item.store === store && item.model === model);
                    const modelQuantity = modelData.reduce((acc, item) => acc + item.quantity, 0);
                    totalQuantity += modelQuantity;
                });
                row.push(totalQuantity);
            });
            row.push('');
            tableData.push(row);
        });

        // Add container for the table
        const container = document.querySelector("#example");

        // Initialize Handsontable
        const hot = new Handsontable(container, {
            data: tableData,
            colHeaders: colHeaders,
            columns: [
                { type: 'text' },
                ...Array(inventoryData.modelsInHeader.length).fill({ type: 'numeric' }),
            ],
            contextMenu: {
                items: {
                    "copy": {
                        name: 'Копіювати',
                        callback: function() {
                            hot.selectCells(hot.getSelected());
                        }
                    },
                    "row_above": {
                        name: 'Вставити рядок зверху',
                        callback: function() {
                            hot.alter('insert_row', hot.getSelected()[0]);
                        }
                    },
                    "row_below": {
                        name: 'Вставити рядок знизу',
                        callback: function() {
                            hot.alter('insert_row', hot.getSelected()[0] + 1);
                        }
                    },
                    "col_left": {
                        name: 'Вставити стовпчик зліва',
                        callback: function() {
                            hot.alter('insert_col', hot.getSelected()[1]);
                        }
                    },
                    "col_right": {
                        name: 'Вставити стовпчик справа',
                        callback: function() {
                            hot.alter('insert_col', hot.getSelected()[1] + 1);
                        }
                    }
                }
            },
            language: 'uk-UA',
            manualColumnMove: true,
            manualColumnResize: true,
            columnSorting: true,
            readOnly: true,
            licenseKey: 'non-commercial-and-evaluation',
            colWidths: [150, 150, 150, 150, 150],
        });

        // Function to export the table to Excel
        document.getElementById('export-btn').addEventListener('click', function() {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet([colHeaders, ...tableData]);
            XLSX.utils.book_append_sheet(wb, ws, inventoryData.inventoryDate);
            XLSX.writeFile(wb, 'MFA.xlsx');
        });
    } catch (error) {
        console.error('Error processing inventory data:', error);
    }
});