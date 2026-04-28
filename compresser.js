/**
* Title: Meshtastic image encoder
* Author: Robodog81
* Date: 28/04/2026
* Version: 2 (first big update)
* Purpose: Encode and decode images for the meshtastic mesh
**/

console.log("Initiated\nWaiting for user input")

const WIDTH = 300
const HEIGHT = 300
const TARGETBASE = 94n// what base to encode to (limited by amount of 2 byte characters in utf8)
const CHARAMT = 199 // the amount of characters to encode to (0 bufs up to this value)
const SENDSIZE = 36 // res of imag


//window.addEventListener('mousemove', mouseMoved)

// Set up the canvas
window.onload=startCanvas

function startCanvas(){
	threshold.hidden = true
	THT.hidden = true
	imageInput.hidden = false
	encodeButton.hidden = true
	decodeButton.hidden = false
	
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
			console.log(imgSize)
			
			ctx.drawImage(img, 0, 0, SENDSIZE, SENDSIZE)
			startEncode()
		}
	})
}

function startEncode(){ // Runs once on load
	document.getElementById("helperText").innerHTML = "Adjust the slider untill the image looks good, then press 'Encode Image'"

	scan = ctx.getImageData(0, 0, SENDSIZE, SENDSIZE)// WIDTH, HEIGHT)
	scanData = scan.data // constantly edited
	scanReadOnly = scanData.slice() // only readed
	
	threshold.hidden = false // show the slider
	THT.hidden = false
	imageInput.hidden = true
	encodeButton.hidden = false
	decodeButton.hidden = true
	
	monoLoop = setInterval(processMono, 1) // loop the thereshold changing code
}

function processMono(){ // runs in a loob for the user to adjust the threshold to convert to mono
	binaryImage = "" // clear the image data
	const slider = document.getElementById("threshold")
	const thresholdValue = slider.value;
	
	for (let i = 0; i < scanReadOnly.length; i += 4){ // convert the image to mono
		const luminance = 0.2126 * scanReadOnly[i] + 0.7152 * scanReadOnly[i + 1] + 0.0722 * scanReadOnly[i + 2]
		const monoValue = (luminance >= thresholdValue) ? 255 : 0
		scanData[i] = monoValue
		scanData[i + 1] = monoValue
		scanData[i + 2] = monoValue
		binaryImage = binaryImage + (monoValue / 255)
	}
	ctx.putImageData(scan, 0, 0)
	
	// scale the image to fit the screen
	scale = 8.333//WIDTH / SENDSIZE //size of image
	const resizedImage = ctx.createImageData(WIDTH, HEIGHT)
	for (let y = 0; y < HEIGHT; y++){
		for (let x = 0; x < WIDTH; x++){
			oldX = Math.floor(x / scale)
			oldY = Math.floor(y / scale)
			oldIdX = (oldY * SENDSIZE + oldX) * 4
			newIdX = (y * WIDTH + x) * 4
			
			resizedImage.data[newIdX] = scan.data[oldIdX]
			resizedImage.data[newIdX + 1] = scan.data[oldIdX + 1]
			resizedImage.data[newIdX + 2] = scan.data[oldIdX + 2]
			resizedImage.data[newIdX + 3] = scan.data[oldIdX + 3]
		}
	}
	ctx.putImageData(resizedImage, 0, 0)
}

function finishEncode(){ // runs once to encode the adjusted image
	threshold.hidden = true
	THT.hidden = true
	imageInput.hidden = false
	encodeButton.hidden = true
	decodeButton.hidden = false

	console.log("button press")
	clearInterval(monoLoop) // stop the loop
	base10 = BigInt("0b" + binaryImage) // convert the binary image to base 10
	
	encoded = ""
	//base10 = BigInt(outStr)
	console.log(base10)
	for (let i = 0; i < CHARAMT; i++){
		encoded = String.fromCharCode(Number(base10 % TARGETBASE) + 31) + encoded
		base10 = (base10 - (base10 % TARGETBASE)) / TARGETBASE
	}
	encoded = encoded + "r"
	console.log(encoded)
	
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
		//input = getClipboardText() // working on pasteless clipboard reading
		console.log(input)
		document.getElementById("helperText").innerHTML = "Decoded" // preemptively say decoded
	} else {
		input = decoderInput
		document.getElementById("helperText").innerHTML = "Image code copied to your clipboard. This is what the sent image will look like."
	}
	
	
	base10Out = 0n
	let placeValue = 1n
	for (let i = input.length - 2; i > 0; i--){ // length - 2 bc it offsets one for the colour char and the other is needed
		base10Out += BigInt(input.charAt(i).codePointAt(0) - 31) * placeValue
		placeValue *= TARGETBASE
		console.log((input.charAt(i).codePointAt(0) - 31))
	}
	console.log(base10Out)
	

	binaryOut = ""
	for (let i = 0; i < SENDSIZE * SENDSIZE ; i++){
		binaryOut = Number(base10Out % 2n) + binaryOut
		base10Out = (base10Out - (base10Out % 2n)) / 2n
	}
	console.log(binaryOut)
	
	scale = WIDTH / SENDSIZE //size of image
	const outputImage = ctx.createImageData(WIDTH, HEIGHT)
	for (let y = 0; y < HEIGHT; y++){
		for (let x = 0; x < WIDTH; x++){
			fillValue = binaryOut.charAt(Math.floor(y / scale) * SENDSIZE + Math.floor(x / scale)) * 255
			
			newIdX = (y * WIDTH + x) * 4
			
			outputImage.data[newIdX] = fillValue
			outputImage.data[newIdX + 1] = fillValue
			outputImage.data[newIdX + 2] = fillValue
			outputImage.data[newIdX + 3] = 255
		}
	}
	ctx.putImageData(outputImage, 0, 0)
}
