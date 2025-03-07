// script.js
const gridContainer = document.getElementById("hexagon-grid");
const scoreDisplay = document.getElementById("score");
const hintButton = document.getElementById("hint-button");
const currentWordDisplay = document.getElementById("current-word");
const answersArea = document.getElementById("answers-area"); // New element

let hexagonRadius = 100; // Keep the radius
let score = 0;
let isDragging = false;
let selectedCells = [];
let validWords = []; // Now it will be loaded from the word list
let originWord = "";
let currentLetters = [];//we need to keep the current letters.
let possibleWords = new Set(); // we now keep all the possible words.
let foundWords = new Set();
let revealedLetters = new Set();

function getVertexCoordinates(radius) {
    const vertices = [];
    for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 3 * i;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        vertices.push({ x, y });
    }
    return vertices;
}

function createHexagonPath(radius) {
    const points = [];
    for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 3 * i;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        points.push(`${x},${y}`);
    }
    return `M${points.join(" L")} Z`;
}

function generateGrid() {
    gridContainer.innerHTML = ""; // Clear previous grid
    const gridWidth = hexagonRadius * 2.2; // approximate width of a hexagon
    const gridHeight = hexagonRadius * 2; // approximate height of a hexagon
    gridContainer.setAttribute("width", gridWidth);
    gridContainer.setAttribute("height", gridHeight);

    const vertices = getVertexCoordinates(hexagonRadius);
    const hexPath = createHexagonPath(hexagonRadius);
    const hexElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
    hexElement.setAttribute("d", hexPath);
    hexElement.setAttribute("class", "hexagon");
    hexElement.setAttribute("transform", `translate(${gridWidth / 2}, ${gridHeight / 2})`); // Center the hexagon
    gridContainer.appendChild(hexElement);

    currentLetters = generateLetterDistribution();
    shuffleArray(currentLetters); // Shuffle the letters
    //find all the possible words.
    possibleWords = findPossibleWords(currentLetters);
    updateAnswerArea();// create the answers area
    for (let i = 0; i < 6; i++) {
        const letter = currentLetters[i];
        const vertex = vertices[i];
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("class", "hexagon-text");
        text.setAttribute("x", vertex.x + gridWidth / 2);
        text.setAttribute("y", vertex.y + gridHeight / 2);
        text.textContent = letter;
        text.dataset.index = i; // Use the vertex index
        text.addEventListener("mousedown", handleMouseDown);
        gridContainer.appendChild(text);
    }

    gridContainer.addEventListener("mousemove", handleMouseMove);
    gridContainer.addEventListener("mouseup", handleMouseUp);
    updateCurrentWordDisplay();
}

function generateLetterDistribution() {
    const sixLetterWords = validWords.filter(word => word.length === 6);
    const randomWord = sixLetterWords[Math.floor(Math.random() * sixLetterWords.length)];
    originWord = randomWord; //we now keep the origin word.
    console.log("Origin word:", originWord);
    let letters = randomWord.split("");// get all the letters
    while (letters.length < 6) {
        letters.push(getRandomLetter());
    }
    // make sure it is 6 letters long.
    return letters.slice(0, 6);
}

function getRandomLetter() {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return alphabet[Math.floor(Math.random() * alphabet.length)];
}
// New function to shuffle an array (Fisher-Yates shuffle)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function updateScore(points) {
    score += points;
    scoreDisplay.textContent = score;
}

function handleMouseDown(event) {
    isDragging = true;
    selectCell(event.target);
}

function handleMouseMove(event) {
    if (isDragging) {
        const cell = event.target.closest('text'); // Only consider text elements
        if (cell) {
            selectCell(cell);
        }
    }
}

function handleMouseUp(event) {
    isDragging = false;
    validateWord();
    resetSelection();
}

function selectCell(cell) {
    if (cell.classList.contains('hexagon-text')) {
        const index = parseInt(cell.dataset.index);
        if (!selectedCells.includes(index)) {
            selectedCells.push(index);
            highlightCell(cell);
            updateCurrentWordDisplay();
        }
    }
}

function highlightCell(cell) {
    cell.classList.add("selected");
}

function unhighlightCell(cell) {
    cell.classList.remove("selected");
}

function clearHighlightedCells() {
    selectedCells.forEach(index => {
        const hexElement = gridContainer.querySelector(`[data-index="${index}"]`);
        if (hexElement) {
            unhighlightCell(hexElement);
        }
    });
}

function validateWord() {
    const word = selectedCells.map((index) => gridContainer.querySelector(`[data-index="${index}"]`).textContent).join("");
    if (validWords.includes(word)) {
        console.log("Valid word:", word);
        updateScore(word.length);
        foundWords.add(word);
        updateAnswerArea(); // reveal the word
    } else {
        console.log("Invalid word:", word);
    }
}

function resetSelection() {
    isDragging = false;
    clearHighlightedCells();
    selectedCells = [];
    updateCurrentWordDisplay();
}

function updateCurrentWordDisplay() {
    //remove previous
    currentWordDisplay.innerHTML = "";
    //add new
    const currentWord = selectedCells.map(index => gridContainer.querySelector(`[data-index="${index}"]`).textContent).join("");
    const currentWordTitle = document.createElement("p");
    currentWordTitle.textContent = currentWord;
    currentWordDisplay.appendChild(currentWordTitle);

}
// New function to find possible words
function findPossibleWords(letters) {
  const possibleWords = new Set(); // Use a Set
  for (const word of validWords) {
    if (word.length >= 3 && word.length <= 6) {
      // Create a copy of the letters array to track used letters
      const availableLetters = [...letters];
      let canForm = true;
      for (const letter of word) {
        const letterIndex = availableLetters.indexOf(letter);
        if (letterIndex === -1) {
          canForm = false;
          break;
        } else {
          availableLetters.splice(letterIndex, 1); // Remove the used letter
        }
      }
      if (canForm) {
        possibleWords.add(word); // Add to the Set
      }
    }
  }
  return possibleWords;
}
// New function to update the answer area
function updateAnswerArea() {
    answersArea.innerHTML = ""; // Clear previous answers
    for (const word of possibleWords) {
        const wordElement = document.createElement("div");
        wordElement.classList.add("hidden-word");
        if(foundWords.has(word)){
          wordElement.textContent = word;
        }else{
          wordElement.textContent = "*".repeat(word.length);
        }
        answersArea.appendChild(wordElement);
    }
}
// function to update the hint display
function updateHintDisplay() {
  const hiddenWords = [];
  // Find all hidden word
  for (const child of answersArea.children) {
    if (child.textContent.includes("*")) {
      hiddenWords.push(child);
    }
  }
  // if there is one, reveal a letter
  if(hiddenWords.length > 0){
    //pick a random hidden word
    const randomHiddenWord = hiddenWords[Math.floor(Math.random() * hiddenWords.length)];
    //find the random letter index
    const index = Math.floor(Math.random() * randomHiddenWord.textContent.length);
    let word;
    for (const w of possibleWords) {
      if(w.length == randomHiddenWord.textContent.length){
        let count = 0;
        for(let i=0; i<randomHiddenWord.textContent.length;i++){
          if(randomHiddenWord.textContent[i] == '*'){
            if(count == index){
              //replace the letter
              const newText = randomHiddenWord.textContent.substring(0,i)+w[i]+randomHiddenWord.textContent.substring(i+1);
              randomHiddenWord.textContent = newText;
              return;
            }
            count ++;
          }
        }
      }
    }
  }
}

function loadWordList() {
    return fetch('words.json') // Return the promise
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Convert words to uppercase
            validWords = data.map(word => word.toUpperCase());
            console.log("Word list loaded:", validWords.length, "words");
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });
}

hintButton.addEventListener('click', () => {
    console.log("hint button clicked");
    updateHintDisplay();
});

// Load the word list, then generate the grid
loadWordList().then(() => generateGrid()); // wait until the words are loaded.
