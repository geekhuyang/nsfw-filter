/**
* @license
* Copyright 2020 Navendu Pottekkat. All Rights Reserved.
* Licensed under the GNU General Public License v3.0
* License copy at https://github.com/navendu-pottekkat/nsfw-filter/blob/master/LICENSE
*
* =======================================================================================
*
* Permissions of this strong copyleft license are conditioned on making 
* available complete source code of licensed works and modifications, 
* which include larger works using a licensed work, 
* under the same license. Copyright and license notices must be preserved. 
* Contributors provide an express grant of patent rights.
*
* =======================================================================================
*/

// Set DEBUG to 0 to prevent logging in the console.
// Used for DEBUGGING purposes.
const DEBUG = 1;
if (!DEBUG) console.log = () => { };

// This should be initially loaded from the storage and it 
// should retain the value set by the user in the popup.

// let BLUR = localStorage.getItem('blur');
// let REPLACE = localStorage.getItem('replace');
// let WATERMARK = localStorage.getItem('watermark');

let BLUR = 1;
let REPLACE = 0;
let WATERMARK = 1;

const WATERMARK_TEXT = "NSFW";


// The script is executed when a user scrolls through a website on the tab that is active in the browser.
let isScrolling;
let images = [...document.getElementsByTagName('img')];

function clasifyImages() {
  /*
  Classifies images and calls all the helper functions.
  */
  [...images, ...document.getElementsByTagName('img')].unique().filter(validImage).forEach(analyzeImage);
}

function validImage(image) {
  /*
  Checks if the image is of a certain height and width and check if the image has already been replaced,
  preventing infinite loops.
  */
  const valid = image.src &&
    image.width > 64 && image.height > 64 &&
    !image.dataset.isReplaced;
  console.log('image %s valid', image.src, valid);
  return valid;
}

function addTextElementToImageNode(imgNode, textContent) {
  const originalParent = imgNode.parentElement;
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.textAlign = 'center';
  container.style.colore = 'white';
  const text = document.createElement('div');
  text.style.position = 'absolute';
  text.style.top = '90%';
  text.style.left = '80%';
  text.style.transform = 'translate(-50%, -50%)';
  text.style.fontSize = '20px';
  text.style.fontFamily = 'Courier New, Courier, monospace';
  text.style.fontWeight = '700';
  text.style.color = 'white';
  text.style.lineHeight = '1em';
  text.style['-webkit-text-fill-color'] = 'white';
  text.style['-webkit-text-stroke-width'] = '1px';
  text.style['-webkit-text-stroke-color'] = 'black';
  // Add the containerNode as a peer to the image, right next to the image.
  originalParent.insertBefore(container, imgNode);
  // Move the imageNode to inside the containerNode;
  container.appendChild(imgNode);
  // Add the text node right after the image node;
  container.appendChild(text);
  text.textContent = textContent;
}

function analyzeImage(image) {
  /*
  Calls the background script passing it the image URL.
  */
  console.log('analyze image %s', image.src);
  chrome.runtime.sendMessage({ url: image.src }, response => {
    console.log('prediction for image %s', image.src, response);
    console.log(image);
    if (response && response.result === true) {
      /*
      If the image should be filtered, it replaces the NSFW 
      image with a random image from https://unsplash.com
      */
      if (REPLACE) {
        const replacedImageSrc = "https://source.unsplash.com/random/" + image.width + "x" + image.height;
        image.src = replacedImageSrc;
        image.srcset = "";
      }
      /*
      It blurs the image.
      */
      if (BLUR) {
        image.style.filter = "blur(20px)";
      }
      /*
      Adds watermark to the image
      */
      if (WATERMARK) {
        addTextElementToImageNode(image, WATERMARK_TEXT)
      }
      image.dataset.filtered = true; // sets filterd to true so that they are not analyzed again
      image.dataset.isReplaced = true; // sets isReplaced to true so that they are not analyzed again
    }
  });
}

window.addEventListener("load", (images) => {
  /*
  Call function when page is loaded.
  */
  clasifyImages();
});

// A function to call the function when the user scrolls is also added because most pages lazy load the images

document.addEventListener("scroll", (images) => {
  /*
  Call function when scrolling and timeout after scrolling stops.
  */
  clearTimeout(isScrolling);
  isScrolling = setTimeout(() => { clasifyImages() }, 100);
});

Array.prototype.unique = function () {
  return this.filter(function (value, index, self) {
    return self.indexOf(value) === index;
  });
}