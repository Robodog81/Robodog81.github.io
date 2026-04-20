/**
* Title: Meshtastic image encoder
* Author: Robodog81
* Date: 06/03/2026
* Version: 1
* Purpose: Encode images to be sent over Meshtastic
**/

console.log("Initiated\nWaiting for user input")

const WIDTH = 300
const HEIGHT = 300
const TARGETBASE = 56000n//11141104n - 10000n // what base to encode to (limited by amount of characters in encoderData)
const CHARAMT = 64 // the amount of characters to encode to (0 bufs up to this value)
const SENDSIZE = 31


//window.addEventListener('mousemove', mouseMoved)

// Set up the canvas
window.onload=startCanvas

function startCanvas(){
	document.getElementById("helperText").innerHTML = "Upload an image"
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
			IMGSIZE = img.naturalWidth
			ctx.drawImage(img, 0, 0, IMGSIZE, IMGSIZE)
			
			encode()
		}
	})
}

function encode(){ // Runs once on load
	scan = ctx.getImageData(0, 0, IMGSIZE, IMGSIZE)// WIDTH, HEIGHT)
	scanData = scan.data
	scanSmall = scanData.slice()
	binaryImage = ""
	
	for (let i = 0; i < scanData.length; i += 4){
		const luminance = 0.2126 * scanData[i] + 0.7152 * scanData[i + 1] + 0.0722 * scanData[i + 2]
		const monoValue = (luminance >= 128) ? 255 : 0
		scanData[i] = monoValue
		scanData[i + 1] = monoValue
		scanData[i + 2] = monoValue
		binaryImage = binaryImage + (monoValue / 255)
	}
	//console.log(binaryImage)
	ctx.putImageData(scan, 0, 0)
	
	// scale the image to fit the screen
	scale = WIDTH / IMGSIZE //size of image
	const resizedImage = ctx.createImageData(WIDTH, HEIGHT)
	for (let y = 0; y < HEIGHT; y++){
		for (let x = 0; x < WIDTH; x++){
			oldX = Math.floor(x / scale)
			oldY = Math.floor(y / scale)
			oldIdX = (oldY * IMGSIZE + oldX) * 4
			newIdX = (y * WIDTH + x) * 4
			
			resizedImage.data[newIdX] = scan.data[oldIdX]
			resizedImage.data[newIdX + 1] = scan.data[oldIdX + 1]
			resizedImage.data[newIdX + 2] = scan.data[oldIdX + 2]
			resizedImage.data[newIdX + 3] = scan.data[oldIdX + 3]
		}
	}
	ctx.putImageData(resizedImage, 0, 0)
	base10 = BigInt("0b" + binaryImage) // convert the binary image to base 10
	
	encoded = ""
	//base10 = 1212121234343434565656567777n
	console.log(base10)
	for (let i = 0; i < CHARAMT; i++){
		encoded = String.fromCharCode(Number(base10 % TARGETBASE) + 161) + encoded
		base10 = (base10 - (base10 % TARGETBASE)) / TARGETBASE
	}
	console.log(encoded)
	navigator.clipboard.writeText(encoded)
}

function decode(){ // decode inputted text. triggered by a button in the HTML
	let input = prompt("Please enter your encoded image:");
	//console.log(encoderData.indexOf("!"))
	
	base10Out = 0n
	let placeValue = 1n
	for (let i = input.length - 1; i > 0; i--){
		base10Out += BigInt(input.charAt(i).codePointAt(0) - 161) * placeValue
		placeValue *= TARGETBASE
		console.log((input.charAt(i).codePointAt(0) - 161))
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
	document.getElementById("helperText").innerHTML = "Decoded"
}






function fill0Buf (bufIn, bufLength){
	let buffer = ""
	console.log(bufLength - Number(bufIn).length)
	for (let i = 0; i < bufLength - Number(bufIn).length; i++){
		buffer += "0"
		console.log(buffer)
	}
	return "" + buffer + bufIn
}
