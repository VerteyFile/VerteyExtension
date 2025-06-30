// Initialize everything when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeUI();
});

function initializeEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            showTab(tabId);
        });
    });

    // Color picker sync
    document.getElementById('backgroundColor').addEventListener('change', function() {
        document.getElementById('backgroundColorText').value = this.value.toUpperCase();
    });

    document.getElementById('backgroundColorText').addEventListener('input', function() {
        if (this.value.match(/^#[0-9A-F]{6}$/i)) {
            document.getElementById('backgroundColor').value = this.value;
        }
    });

    // Auto-detect file format and filter "To" options
    document.getElementById('fileInput').addEventListener('change', function() {
        if (this.files[0]) {
            const fileName = this.files[0].name;
            const extension = fileName.split('.').pop().toLowerCase();
            const fromSelect = document.getElementById('fromFormat');
            
            // Auto-select format if available
            for (let option of fromSelect.options) {
                if (option.value === extension) {
                    fromSelect.value = extension;
                    filterToOptions(extension);
                    break;
                }
            }
        }
    });

    // Filter "To" options when "From" format changes
    document.getElementById('fromFormat').addEventListener('change', function() {
        filterToOptions(this.value);
    });

    // Show/hide extraction options based on target format
    document.getElementById('toFormat').addEventListener('change', function() {
        const extractTextGroup = document.getElementById('extractText');
        const extractImagesGroup = document.getElementById('extractImages');
        const extractFormFieldsGroup = document.getElementById('extractFormFields');
        const extractSignaturesGroup = document.getElementById('extractSignatures');
        
        // Hide all extraction options first
        extractTextGroup.style.display = 'none';
        extractImagesGroup.style.display = 'none';
        extractFormFieldsGroup.style.display = 'none';
        extractSignaturesGroup.style.display = 'none';
        
        if (this.value === 'extract') {
            extractTextGroup.style.display = 'flex';
            extractImagesGroup.style.display = 'flex';
        } else if (this.value === 'fdf-extract') {
            extractFormFieldsGroup.style.display = 'flex';
            extractSignaturesGroup.style.display = 'flex';
        }
    });

    // Make checkbox groups fully clickable
    document.querySelectorAll('.checkbox-group').forEach(group => {
        group.addEventListener('click', function(e) {
            // Don't trigger if the actual checkbox was clicked (to avoid double-toggle)
            if (e.target.type === 'checkbox') {
                return;
            }
            
            // Find the checkbox within this group
            const checkbox = this.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                
                // Trigger change event for any dependent functionality
                checkbox.dispatchEvent(new Event('change'));
            }
        });
    });

    // Corruption confirmation checkbox
    document.getElementById('confirmCorruption').addEventListener('change', function() {
        const corruptBtn = document.getElementById('corruptFileBtn');
        corruptBtn.disabled = !this.checked;
    });

    // Button event listeners
    document.getElementById('convertFileBtn').addEventListener('click', convertFile);
    document.getElementById('corruptFileBtn').addEventListener('click', corruptFile);
}

// Define conversion compatibility
const conversionMatrix = {
    // Document formats
    'pdf': ['docx', 'doc', 'txt', 'rtf', 'jpg', 'png', 'extract', 'fdf-extract'],
    'docx': ['pdf', 'doc', 'txt', 'rtf', 'jpg', 'png'],
    'doc': ['pdf', 'docx', 'txt', 'rtf', 'jpg', 'png'],
    'txt': ['pdf', 'docx', 'doc', 'rtf'],
    'rtf': ['pdf', 'docx', 'doc', 'txt'],
    
    // Image formats
    'jpg': ['png', 'gif', 'bmp', 'tiff', 'webp', 'pdf'],
    'jpeg': ['png', 'gif', 'bmp', 'tiff', 'webp', 'pdf', 'jpg'],
    'png': ['jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp', 'pdf'],
    'gif': ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'webp', 'pdf'],
    'bmp': ['jpg', 'jpeg', 'png', 'gif', 'tiff', 'webp', 'pdf'],
    'tiff': ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'pdf'],
    'webp': ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'pdf'],
    
    // Video formats
    'mp4': ['avi', 'mov', 'wmv', 'mp3', 'wav', 'aac'],
    'avi': ['mp4', 'mov', 'wmv', 'mp3', 'wav', 'aac'],
    'mov': ['mp4', 'avi', 'wmv', 'mp3', 'wav', 'aac'],
    'wmv': ['mp4', 'avi', 'mov', 'mp3', 'wav', 'aac'],
    
    // Audio formats
    'mp3': ['wav', 'flac', 'aac'],
    'wav': ['mp3', 'flac', 'aac'],
    'flac': ['mp3', 'wav', 'aac'],
    'aac': ['mp3', 'wav', 'flac']
};

function filterToOptions(fromFormat) {
    const toSelect = document.getElementById('toFormat');
    const currentValue = toSelect.value;
    
    // Clear current options except the first one
    toSelect.innerHTML = '<option value="">Select format</option>';
    
    if (!fromFormat) {
        // If no format selected, show all options
        const allOptions = [
            {value: 'pdf', text: 'PDF'},
            {value: 'jpg', text: 'JPG'},
            {value: 'png', text: 'PNG'},
            {value: 'docx', text: 'DOCX'},
            {value: 'mp4', text: 'MP4'},
            {value: 'mp3', text: 'MP3'},
            {value: 'jpeg', text: 'JPEG'},
            {value: 'txt', text: 'TXT'},
            {value: 'doc', text: 'DOC'},
            {value: 'gif', text: 'GIF'},
            {value: 'webp', text: 'WebP'},
            {value: 'avi', text: 'AVI'},
            {value: 'mov', text: 'MOV'},
            {value: 'wav', text: 'WAV'},
            {value: 'extract', text: 'Extract Content'},
            {value: 'fdf-extract', text: 'Extract Form Data (FDF)'},
            {value: 'bmp', text: 'BMP'},
            {value: 'tiff', text: 'TIFF'},
            {value: 'rtf', text: 'RTF'},
            {value: 'flac', text: 'FLAC'},
            {value: 'wmv', text: 'WMV'},
            {value: 'aac', text: 'AAC'}
        ];
        
        allOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            toSelect.appendChild(optionElement);
        });
        return;
    }
    
    // Get compatible formats for the selected "from" format
    const compatibleFormats = conversionMatrix[fromFormat] || [];
    
    // Define format labels
    const formatLabels = {
        'pdf': 'PDF',
        'jpg': 'JPG',
        'jpeg': 'JPEG',
        'png': 'PNG',
        'gif': 'GIF',
        'bmp': 'BMP',
        'tiff': 'TIFF',
        'webp': 'WebP',
        'docx': 'DOCX',
        'doc': 'DOC',
        'txt': 'TXT',
        'rtf': 'RTF',
        'mp4': 'MP4',
        'avi': 'AVI',
        'mov': 'MOV',
        'wmv': 'WMV',
        'mp3': 'MP3',
        'wav': 'WAV',
        'flac': 'FLAC',
        'aac': 'AAC',
        'extract': 'Extract Content',
        'fdf-extract': 'Extract Form Data (FDF)'
    };
    
    // Add compatible options in order of popularity
    const popularityOrder = ['pdf', 'jpg', 'png', 'docx', 'mp4', 'mp3', 'jpeg', 'txt', 'doc', 'gif', 'webp', 'avi', 'mov', 'wav', 'extract', 'fdf-extract', 'bmp', 'tiff', 'rtf', 'flac', 'wmv', 'aac'];
    
    popularityOrder.forEach(format => {
        if (compatibleFormats.includes(format)) {
            const option = document.createElement('option');
            option.value = format;
            option.textContent = formatLabels[format];
            toSelect.appendChild(option);
        }
    });
    
    // Restore previous selection if it's still valid
    if (compatibleFormats.includes(currentValue)) {
        toSelect.value = currentValue;
    }
}

function initializeUI() {
    // Initially hide extraction options
    const extractTextGroup = document.getElementById('extractText');
    const extractImagesGroup = document.getElementById('extractImages');
    const extractFormFieldsGroup = document.getElementById('extractFormFields');
    const extractSignaturesGroup = document.getElementById('extractSignatures');
    
    extractTextGroup.style.display = 'none';
    extractImagesGroup.style.display = 'none';
    extractFormFieldsGroup.style.display = 'none';
    extractSignaturesGroup.style.display = 'none';
}

// Tab switching functionality
function showTab(tabId) {
    // Hide all tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab pane
    document.getElementById(tabId).classList.add('active');
    
    // Add active class to clicked tab
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
}

// Status message helper
function showStatus(elementId, message, type) {
    const statusEl = document.getElementById(elementId);
    statusEl.className = `status-message status-${type}`;
    statusEl.textContent = message;
    statusEl.style.display = 'block';
    
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 4000);
    }
}

// Helper function to convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Convert file functionality
async function convertFile() {
    const fileInput = document.getElementById('fileInput');
    const fromFormat = document.getElementById('fromFormat').value;
    const toFormat = document.getElementById('toFormat').value;
    
    if (!fileInput.files[0]) {
        showStatus('fileStatus', 'Please select a file to convert', 'error');
        return;
    }
    
    if (!fromFormat || !toFormat) {
        showStatus('fileStatus', 'Please select both source and target formats', 'error');
        return;
    }
    
    console.log('Converting from:', fromFormat, 'to:', toFormat);
    
    // Add visual feedback to button
    const convertBtn = document.getElementById('convertFileBtn');
    const originalText = convertBtn.textContent;
    convertBtn.textContent = 'Converting...';
    convertBtn.disabled = true;
    
    showStatus('fileStatus', 'Processing your file...', 'loading');
    
    try {
        const file = fileInput.files[0];
        
        // Check if this is a video to audio conversion
        const isVideoToAudio = (fromFormat === 'mp4' || fromFormat === 'avi' || fromFormat === 'mov' || fromFormat === 'wmv') && 
                              (toFormat === 'mp3' || toFormat === 'wav' || toFormat === 'aac');
        
        if (isVideoToAudio) {
            // Use alternative video conversion method
            await convertVideoToAudio(file, fromFormat, toFormat);
        } else {
            // Use original ConvertAPI for other conversions
            await convertWithOriginalAPI(file, fromFormat, toFormat);
        }
        
    } catch (error) {
        console.error('Conversion error:', error);
        showStatus('fileStatus', `Error: ${error.message}`, 'error');
    } finally {
        // Reset button
        convertBtn.textContent = originalText;
        convertBtn.disabled = false;
    }
}

// New function for video to audio conversion using Web Audio API
async function convertVideoToAudio(file, fromFormat, toFormat) {
    try {
        // Create a video element to extract audio
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Load the video file
        const videoUrl = URL.createObjectURL(file);
        video.src = videoUrl;
        video.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
            video.onloadedmetadata = () => {
                video.currentTime = 0;
                resolve();
            };
            video.onerror = () => reject(new Error('Failed to load video file'));
        });
        
        // Set up audio context for extraction
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaElementSource(video);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        
        // Record the audio
        const mediaRecorder = new MediaRecorder(destination.stream, {
            mimeType: toFormat === 'mp3' ? 'audio/webm' : `audio/${toFormat}`
        });
        
        const chunks = [];
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(chunks, { 
                type: toFormat === 'mp3' ? 'audio/webm' : `audio/${toFormat}` 
            });
            
            // Download the converted audio
            const url = URL.createObjectURL(audioBlob);
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = `${file.name.split('.')[0]}.${toFormat}`;
            downloadLink.style.display = 'none';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(url);
            URL.revokeObjectURL(videoUrl);
            
            showStatus('fileStatus', 'Video converted to audio successfully!', 'success');
        };
        
        // Start recording and play video
        mediaRecorder.start();
        video.play();
        
        // Stop recording when video ends
        video.onended = () => {
            mediaRecorder.stop();
            audioContext.close();
        };
        
    } catch (error) {
        // Fallback to FFmpeg.wasm if available, or show error
        throw new Error(`Video conversion failed: ${error.message}. Please try a different file or format.`);
    }
}

// Original ConvertAPI function for non-video conversions
async function convertWithOriginalAPI(file, fromFormat, toFormat) {
    const base64Data = await fileToBase64(file);
    
    const apiUrl = `https://v2.convertapi.com/convert/${fromFormat}/to/${toFormat}`;
    console.log('API URL:', apiUrl);
    
    const requestBody = {
        Parameters: [
            {
                Name: "File",
                FileValue: {
                    Name: file.name,
                    Data: base64Data
                }
            },
            {
                Name: "StoreFile",
                Value: true
            }
        ]
    };

    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    // Add extraction parameters
    if (toFormat === 'extract') {
        if (document.getElementById('extractTextCheck').checked) {
            requestBody.Parameters.push({
                Name: "ExtractText",
                Value: true
            });
        }
        if (document.getElementById('extractImagesCheck').checked) {
            requestBody.Parameters.push({
                Name: "ExtractImages", 
                Value: true
            });
        }
    }

    if (toFormat === 'fdf-extract') {
        if (document.getElementById('extractFormFieldsCheck').checked) {
            requestBody.Parameters.push({
                Name: "ExtractFormFields",
                Value: true
            });
        }
        if (document.getElementById('extractSignaturesCheck').checked) {
            requestBody.Parameters.push({
                Name: "ExtractSignatures",
                Value: true
            });
        }
    }

    // Add optional parameters
    if (document.getElementById('useBackgroundColor').checked) {
        requestBody.Parameters.push({
            Name: "BackgroundColor",
            Value: document.getElementById('backgroundColor').value
        });
    }

    // Add auto-orient parameter
    if (document.getElementById('autoOrient').checked) {
        requestBody.Parameters.push({
            Name: "AutoOrient",
            Value: true
        });
    }

    // Add strip metadata parameter
    if (document.getElementById('stripMetadata').checked) {
        requestBody.Parameters.push({
            Name: "StripMetadata",
            Value: true
        });
    }

    // Add PDF parameters
    if (toFormat === 'pdf') {
        requestBody.Parameters.push(
            {
                Name: "PageOrientation",
                Value: document.getElementById('pageOrientation').value
            },
            {
                Name: "PageSize",
                Value: document.getElementById('pageSize').value
            },
            {
                Name: "MarginTop",
                Value: document.getElementById('marginTop').value
            },
            {
                Name: "MarginRight", 
                Value: document.getElementById('marginRight').value
            },
            {
                Name: "MarginBottom",
                Value: document.getElementById('marginBottom').value
            },
            {
                Name: "MarginLeft",
                Value: document.getElementById('marginLeft').value
            },
            {
                Name: "Dpi",
                Value: parseInt(document.getElementById('dpi').value)
            }
        );
    }

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer sgaMlDSXJa2mp7jz1JQzEsjNNTKxMlf3',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (result.Files && result.Files.length > 0) {
        const fileUrl = result.Files[0].Url;
        
        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = fileUrl;
        downloadLink.download = result.Files[0].FileName || `converted.${toFormat}`;
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        showStatus('fileStatus', 'File converted and downloaded successfully!', 'success');
    } else {
        throw new Error('No converted file received from API');
    }
}

// Corrupt file functionality
async function corruptFile() {
    const fileInput = document.getElementById('corruptFileInput');
    const corruptionLevel = document.getElementById('corruptionLevel').value;
    const corruptionType = document.getElementById('corruptionType').value;
    const preserveSize = document.getElementById('preserveSize').checked;
    const addExtension = document.getElementById('addExtension').checked;
    
    if (!fileInput.files[0]) {
        showStatus('corruptStatus', 'Please select a file to corrupt', 'error');
        return;
    }
    
    if (!document.getElementById('confirmCorruption').checked) {
        showStatus('corruptStatus', 'Please confirm that you understand this will damage the file', 'error');
        return;
    }
    
    const confirmBtn = document.getElementById('corruptFileBtn');
    const originalText = confirmBtn.textContent;
    confirmBtn.textContent = 'Corrupting...';
    confirmBtn.disabled = true;
    
    showStatus('corruptStatus', 'Corrupting your file...', 'loading');
    
    try {
        const file = fileInput.files[0];
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Calculate corruption percentage
        const corruptionPercent = {
            'light': 0.05,
            'medium': 0.15,
            'heavy': 0.30,
            'severe': 0.50
        }[corruptionLevel];
        
        const bytesToCorrupt = Math.floor(uint8Array.length * corruptionPercent);
        
        // Create a copy to work with
        const corruptedArray = new Uint8Array(uint8Array);
        
        // Apply corruption based on type
        switch (corruptionType) {
            case 'random':
                // Randomly corrupt bytes throughout the file
                const positions = new Set();
                while (positions.size < bytesToCorrupt) {
                    positions.add(Math.floor(Math.random() * corruptedArray.length));
                }
                positions.forEach(pos => {
                    corruptedArray[pos] = Math.floor(Math.random() * 256);
                });
                break;
                
            case 'header':
                // Corrupt the first 1KB or file size, whichever is smaller
                const headerSize = Math.min(1024, corruptedArray.length);
                const headerBytesToCorrupt = Math.min(bytesToCorrupt, headerSize);
                for (let i = 0; i < headerBytesToCorrupt; i++) {
                    const randomIndex = Math.floor(Math.random() * headerSize);
                    corruptedArray[randomIndex] = Math.floor(Math.random() * 256);
                }
                break;
                
            case 'middle':
                // Corrupt the middle 20% of the file
                const start = Math.floor(corruptedArray.length * 0.4);
                const end = Math.floor(corruptedArray.length * 0.6);
                const middleSection = end - start;
                const middleBytesToCorrupt = Math.min(bytesToCorrupt, middleSection);
                for (let i = 0; i < middleBytesToCorrupt; i++) {
                    const randomIndex = start + Math.floor(Math.random() * middleSection);
                    corruptedArray[randomIndex] = Math.floor(Math.random() * 256);
                }
                break;
                
            case 'footer':
                // Corrupt the last 1KB or file size, whichever is smaller
                const footerStart = Math.max(0, corruptedArray.length - 1024);
                const footerSize = corruptedArray.length - footerStart;
                const footerBytesToCorrupt = Math.min(bytesToCorrupt, footerSize);
                for (let i = 0; i < footerBytesToCorrupt; i++) {
                    const randomIndex = footerStart + Math.floor(Math.random() * footerSize);
                    corruptedArray[randomIndex] = Math.floor(Math.random() * 256);
                }
                break;
                
            case 'scattered':
                // Scatter corruption throughout the file in chunks
                const numChunks = 10;
                const chunkSize = Math.floor(corruptedArray.length / numChunks);
                const bytesPerChunk = Math.floor(bytesToCorrupt / numChunks);
                
                for (let chunk = 0; chunk < numChunks; chunk++) {
                    const chunkStart = chunk * chunkSize;
                    const chunkEnd = Math.min(chunkStart + chunkSize, corruptedArray.length);
                    
                    for (let i = 0; i < bytesPerChunk && chunkStart < chunkEnd; i++) {
                        const randomIndex = chunkStart + Math.floor(Math.random() * (chunkEnd - chunkStart));
                        corruptedArray[randomIndex] = Math.floor(Math.random() * 256);
                    }
                }
                break;
        }
        
        // Handle size preservation
        let finalArray = corruptedArray;
        if (!preserveSize) {
            const sizeChange = (Math.random() * 0.2) - 0.1; // ±10% size change
            const newSize = Math.max(1, Math.floor(corruptedArray.length * (1 + sizeChange)));
            
            if (newSize < corruptedArray.length) {
                // Truncate the file
                finalArray = corruptedArray.slice(0, newSize);
            } else if (newSize > corruptedArray.length) {
                // Extend the file with random data
                finalArray = new Uint8Array(newSize);
                finalArray.set(corruptedArray);
                // Fill extra bytes with random data
                for (let i = corruptedArray.length; i < newSize; i++) {
                    finalArray[i] = Math.floor(Math.random() * 256);
                }
            }
        }
        
        // Create corrupted file blob
        const blob = new Blob([finalArray], { type: 'application/octet-stream' });
        
        // Determine filename
        let fileName = file.name;
        if (addExtension && !fileName.endsWith('.corrupted')) {
            fileName += '.corrupted';
        }
        
        // Create and trigger download
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = fileName;
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
        
        const sizeChange = finalArray.length - uint8Array.length;
        const sizeInfo = sizeChange !== 0 ? ` Size changed by ${sizeChange} bytes.` : '';
        showStatus('corruptStatus', `File corrupted successfully! ${bytesToCorrupt} bytes modified.${sizeInfo}`, 'success');
        
    } catch (error) {
        console.error('Corruption error:', error);
        showStatus('corruptStatus', `Error: ${error.message}`, 'error');
    } finally {
        // Reset button state
        confirmBtn.textContent = originalText;
        confirmBtn.disabled = !document.getElementById('confirmCorruption').checked;
    }
}