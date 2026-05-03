/**
* Title: Meshtastic image encoder
* Author: Robodog81
* Date: 03/05/2026
* Version: 3 (colour)
* Purpose: Encode and decode images for the meshtastic mesh
**/

console.log("Initiated\nWaiting for user input")

const WIDTH = 300
const HEIGHT = 300
const TARGETBASE = 94n// what base to encode to (limited by amount of 2 byte characters in utf8)
const CHARAMT = 199 // the amount of characters to encode to (0 bufs up to this value)
const SENDSIZE = 36 // res of imag
const CHAROFFSET = 31 // the offset for printable characters

const COLOURDATA = [
	[255, 0, 0],
	[0, 255, 0],
	[0, 0, 255],
	[255, 255, 0],
	[0, 255, 255],
	[255, 0, 255],
	[101, 67, 33],
	[0, 0, 0],
	[255, 255, 255],
]

colourPrimary = "rgb(255, 255, 255)"
colourSecondary = "rgb(0, 0, 0)"

inColNum1 = 8// make global for cross function use
inColNum2 = 9

//window.addEventListener('mousemove', mouseMoved)

// Set up the canvas
window.onload=startCanvas

function toRgb(inCol){
	return `rgb(${inCol[0]},${inCol[1]},${inCol[2]})`
}

function startCanvas(){
	threshold.hidden = true
	THT.hidden = true
	imageInput.hidden = false
	encodeButton.hidden = true
	decodeButton.hidden = false
	
	const elements = document.querySelectorAll(".colour"); // hide the colour sliders
	elements.forEach(el => {
		el.hidden = true
	});
	
	console.log("Upload a " + SENDSIZE + "x" + SENDSIZE + " image or decode a recived string")
	document.getElementById("helperText").innerHTML = "Upload an image, it will automatically be scalled " + SENDSIZE + "x" + SENDSIZE
	const input = document.getElementById("imageInput")
	const canvas = document.getElementById("myCanvas")
	ctx = canvas.getContext("2d")
		
	input.addEventListener('change', (e) => { // get the image and place it on the canvas
		console.log("Change detected")
		const file = e.target.files[0];
		if (!file) return
		
		const img = new Image()
		
		img.src = URL.createObjectURL(file)
		
		img.onload = () => {
			URL.revokeObjectURL(img.src)
			
			console.log("Image uploaded\nImage is " + img.naturalWidth + " pixels\nStarting encoder")
			imgSize = img.naturalWidth
			
			ctx.drawImage(img, 0, 0, SENDSIZE, SENDSIZE)
			startEncode()
		}
	})
}

function startEncode(){ // Runs once on load
	document.getElementById("helperText").innerHTML = "Adjust the sliders untill the image looks good, then press 'Encode Image'"

	scan = ctx.getImageData(0, 0, SENDSIZE, SENDSIZE)// WIDTH, HEIGHT)
	scanData = scan.data // constantly edited
	scanReadOnly = scanData.slice() // only readed
	
	threshold.hidden = false // show the slider
	THT.hidden = false
	imageInput.hidden = true
	encodeButton.hidden = false
	decodeButton.hidden = true
	
	const elements = document.querySelectorAll(".colour"); // show the colour sliders
	elements.forEach(el => {
		el.hidden = false
	});
	
	monoLoop = setInterval(processMono, 1) // loop the thereshold changing code
}

function processMono(){ // runs in a loob for the user to adjust the threshold to convert to mono
	binaryImage = "" // clear the image data
	const thresholdValue = document.getElementById("threshold").value
	inColNum1 = Number(document.getElementById("col1").value)
	inColNum2 = Number(document.getElementById("col2").value)
	
	for (let i = 0; i < scanReadOnly.length; i += 4){ // convert the image to mono
		const luminance = 0.2126 * scanReadOnly[i] + 0.7152 * scanReadOnly[i + 1] + 0.0722 * scanReadOnly[i + 2]
		const monoValue = (luminance >= thresholdValue) ? 255 : 0
		scanData[i] = monoValue
		scanData[i + 1] = monoValue
		scanData[i + 2] = monoValue
		binaryImage = binaryImage + (monoValue / 255)
	}
	ctx.putImageData(scan, 0, 0)

	colourPrimary = COLOURDATA[inColNum1 - 1] // select the collour from the recived number
	colourSecondary = COLOURDATA[inColNum2 - 1]
	
	//accent the sliders to the selected colours
	if (toRgb(colourPrimary) == "rgb(255,255,255)"){ // change white slider thumbs to light gray
		document.getElementById("col1").style.accentColor = "rgb(235, 235, 235)"
	} else { 
		document.getElementById("col1").style.accentColor = toRgb(colourPrimary)
	}
	if (toRgb(colourSecondary) == "rgb(255,255,255)"){
		document.getElementById("col2").style.accentColor = "rgb(235, 235, 235)"
	} else { 
		document.getElementById("col2").style.accentColor = toRgb(colourSecondary)
	}
	
	// scale the image to fit the screen and do all of the prosesing (treshold and colour)
	scale = WIDTH / SENDSIZE //size of image
	const processedImage = ctx.createImageData(WIDTH, HEIGHT)
	for (let y = 0; y < HEIGHT; y++){
		for (let x = 0; x < WIDTH; x++){
			oldX = Math.floor(x / scale)
			oldY = Math.floor(y / scale)
			oldIdX = (oldY * SENDSIZE + oldX) * 4
			newIdX = (y * WIDTH + x) * 4
			
			if (scan.data[oldIdX] == 0){ // if the red pixel is on (works since the image is already monochrome)
				processedImage.data[newIdX] = colourPrimary[0] // finds the red green or blue valuse and adds them to the image buffer
				processedImage.data[newIdX + 1] = colourPrimary[1]
				processedImage.data[newIdX + 2] = colourPrimary[2]
				processedImage.data[newIdX + 3] = 255
			} else {
				processedImage.data[newIdX] = colourSecondary[0]
				processedImage.data[newIdX + 1] = colourSecondary[1]
				processedImage.data[newIdX + 2] = colourSecondary[2]
				processedImage.data[newIdX + 3] = 255
			}
		}
	}
	ctx.putImageData(processedImage, 0, 0)
}

function finishEncode(){ // runs once to encode the adjusted image
	threshold.hidden = true
	THT.hidden = true
	imageInput.hidden = false
	encodeButton.hidden = true
	decodeButton.hidden = false
	
	const elements = document.querySelectorAll(".colour"); // hide the colour sliders
	elements.forEach(el => {
		el.hidden = true
	});

	console.log("button press")
	clearInterval(monoLoop) // stop the loop
	base10 = BigInt("0b" + binaryImage) // convert the binary image to base 10
	
	encoded = ""
	for (let i = 0; i < CHARAMT; i++){
		encoded = String.fromCharCode(Number(base10 % TARGETBASE) + CHAROFFSET) + encoded
		base10 = (base10 - (base10 % TARGETBASE)) / TARGETBASE
	}
	encoded = encoded + String.fromCharCode(((inColNum2 - 1) * 9 + inColNum1) + CHAROFFSET) // add colour (1 - 81)
		
	document.getElementById("helperText").innerHTML = "Click allow to copy the image to clipboard"
	navigator.clipboard.writeText(encoded)
		.then(() => {
			console.log("Image code copied to your clipboard");
			document.getElementById("helperText").innerHTML = "Image code copied to your clipboard"
			decode(encoded)
		})
		.catch((err) => {
			console.error("Error: Could not copy text", err);
			document.getElementById("helperText").innerHTML = "Copy failed, refresh and try again"
		});
}

function decode(decoderInput){ // decode inputted text. triggered by a button in the HTML
	if (decoderInput === undefined){ // check if the function has an argument passed in
		input = prompt("Please enter your encoded image:");
		document.getElementById("helperText").innerHTML = "Decoded" // preemptively say decoded
	} else {
		input = decoderInput
		document.getElementById("helperText").innerHTML = "Image code copied to your clipboard. This is what the sent image will look like."
	}
	
	
	base10Out = 0n
	let placeValue = 1n
	for (let i = input.length - 2; i > 0; i--){ // length - 2 bc it offsets one for the colour char and the other is needed
		base10Out += BigInt(input.charAt(i).codePointAt(0) - CHAROFFSET) * placeValue
		placeValue *= TARGETBASE
	}

	binaryOut = ""
	for (let i = 0; i < SENDSIZE * SENDSIZE ; i++){
		binaryOut = Number(base10Out % 2n) + binaryOut
		base10Out = (base10Out - (base10Out % 2n)) / 2n
	}
	
	finalChar = input.charAt(199).codePointAt(0) - CHAROFFSET // figure out colours using the final char in the code
	colNum1 = ((finalChar - 1) % 9) + 1
	colNum2 = Math.ceil(finalChar / 9)
	
	colourPrimary = COLOURDATA[ColNum1 - 1] // select the collour from the recived number
	colourSecondary = COLOURDATA[ColNum2 - 1]
	
	console.log("decode")
	scale = WIDTH / SENDSIZE //size of image
	const outputImage = ctx.createImageData(WIDTH, HEIGHT)
	for (let y = 0; y < HEIGHT; y++){
		for (let x = 0; x < WIDTH; x++){
			fillValue = binaryOut.charAt(Math.floor(y / scale) * SENDSIZE + Math.floor(x / scale)) * 255
			
			newIdX = (y * WIDTH + x) * 4
			
			if (fillValue == 0){
				outputImage.data[newIdX] = colourPrimary[0] // finds the red green or blue values and adds them to the image buffer
				outputImage.data[newIdX + 1] = colourPrimary[1]
				outputImage.data[newIdX + 2] = colourPrimary[2]
				outputImage.data[newIdX + 3] = 255
			} else {
				outputImage.data[newIdX] = colourSecondary[0]
				outputImage.data[newIdX + 1] = colourSecondary[1]
				outputImage.data[newIdX + 2] = colourSecondary[2]
				outputImage.data[newIdX + 3] = 255
			}
		}
	}
	console.log("Finished")
	ctx.putImageData(outputImage, 0, 0)
}
