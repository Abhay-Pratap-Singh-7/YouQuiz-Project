const start = document.getElementById('get-started');
const welcome = document.getElementById('welcome-screen');
const search = document.getElementById('search-bar');

const videoSearch = document.querySelector('.search');
const videoInput = document.getElementById('inputText');
const searchButton = document.getElementById('getVideo');

const videoTitle = document.getElementById('video-title');
const videoDescription = document.getElementById('video-description');
const videoThumbnail = document.getElementById('thumbnail');

const videoDetails = document.getElementById('video-section');
const videoArea = document.querySelector('.videos')

const quizSection = document.querySelector('.quiz');

const resultSection = document.getElementById('result-section');

const nextButton = document.getElementById('next-btn');

const question = document.getElementById('question-text')
const options = [document.getElementById('option-1'), document.getElementById('option-2'), document.getElementById('option-3'), document.getElementById('option-4')]
const submitButton = document.getElementById('submit-btn');

let count = 0;
let score = 0;

let data = {};
let quizData = {};

const BASE_URL = 'https://www.googleapis.com/youtube/v3/search';
const API_KEY = '';
const QUIZ_API_URL = '';

async function fetchVideoDetails(videoId) {
    const url = `${BASE_URL}?q=${videoId}&key=${API_KEY}&part=snippet&type=video&videoDuration=medium&maxResults=10`;
    try {
        const response = await fetch(url);
        data = await response.json();
        console.log(data);
        displayVideoDetails();
    }
    catch (error) {
        console.error('Error fetching video details:', error);
    }
}

start.addEventListener('click', () => {
    welcome.style.display = 'none';
    search.style.display = 'flex';
});

searchButton.addEventListener('click', () => {
    const videoId = videoInput.value;
    fetchVideoDetails(videoId);
});

videoInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const videoId = videoInput.value;
        fetchVideoDetails(videoId)
    }
});


function displayVideoDetails() {
    videoArea.innerHTML = '';
    videoArea.style.display = 'flex';
    videoSearch.style.marginTop = '100px';
    data.items.forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.innerHTML = `<img src="${video.snippet.thumbnails.high.url}" alt="Video Thumbnail">
            <h3>${video.snippet.title}</h3>
            <p>${video.snippet.description}</p>
            <p class="vidId" style="display: none;">${video.id.videoId}</p>
            <button class="start-quiz-btn">Take Quiz</button>
        `;
        videoDetails.appendChild(videoCard);

        const quizButton = videoCard.querySelector('.start-quiz-btn');
        quizButton.addEventListener('click', () => {
            videoArea.style.display = 'none';
            videoSearch.style.display = 'none';
            quizSection.style.display = 'flex';

            const videoId = videoCard.querySelector('.vidId').innerText;
            const videoTitle = videoCard.querySelector('h3').innerText;
            const videoDescription = videoCard.querySelector('p').innerText;
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            
            fetchQuizQuestions(videoUrl, videoTitle, videoDescription);
        });
    });
}

async function fetchQuizQuestions(videoUrl, videoTitle, videoDescription) {

    document.body.style.background = `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 150"><path fill="none" stroke="%234CAF50" stroke-width="15" stroke-linecap="round" stroke-dasharray="300 385" stroke-dashoffset="0" d="M275 75c0 31-27 50-50 50-58 0-92-100-150-100-28 0-50 22-50 50s23 50 50 50c58 0 92-100 150-100 24 0 50 19 50 50Z"><animate attributeName="stroke-dashoffset" calcMode="spline" dur="2" values="685;-685" keySplines="0 0 1 1" repeatCount="indefinite"></animate></path></svg>')`;
    document.body.style.backgroundSize = '150px 75px';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundPosition = 'center';

    quizSection.style.display = 'none';

    try {
        let response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${QUIZ_API_URL}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "deepseek/deepseek-chat-v3.1:free",
                "messages": [
                    {
                        "role": "user",
                        "content": `You are an expert quiz creator for educational content. You need to create a quiz based on this YouTube video: ${videoUrl} First, you will ANALYZE THE ACTUAL VIDEO CONTENT by:
                        1. Understanding what the video is teaching (e.g., programming, history, science)
                        2. Identifying key concepts, facts, and information presented in the video
                        3. Focusing only on information explicitly stated or shown in the video

                        IMPORTANT INSTRUCTIONS FOR CREATING QUESTIONS:
                        - Create 30 multiple-choice questions STRICTLY based on CONTENT shown in the video
                        - 10 easy questions about basic concepts covered
                        - 10 medium questions that test deeper understanding
                        - 10 hard questions that test application of concepts

                        CRITICAL RULES:
                        Main point : The order of option MUST be shuffled randomly for each question.
                        1. ALL questions must be MCQ format with 4 options
                        2. ONLY include questions about information actually presented in the video
                        3. DO NOT create questions about metadata (title, upload date, etc.)
                        4. DO NOT make up information not in the video
                        5. DO NOT create questions about unrelated topics
                        6. If you're unsure about the content, create general questions about the stated topic
                        7. For educational/tutorial videos, focus on concepts taught

                        Additional context about the video:
                        Title: ${videoTitle}
                        Description: ${videoDescription}

                        Return ONLY a JSON object with this exact format:
                        {
                        "questions": [
                            {
                            "id": "1",
                            "text": "Question about specific content from the video?",
                            "type": "mcq",
                            "difficulty": "easy", 
                            "options": ["Option A", "Option B", "Option C", "Option D"],
                            "correctAnswer": "Option that is correct"
                            },
                            // more questions...
                        ]
                        }` 
                    }
                ]
            })
        });

        let responseData = await response.json();
        const content = responseData.choices[0].message.content;

        const startIndex = content.indexOf('{');
        const endIndex = content.lastIndexOf('}');
        
        if (startIndex !== -1 && endIndex !== -1) {
            const jsonString = content.substring(startIndex, endIndex + 1);
            
            quizData = JSON.parse(jsonString);
            console.log(quizData);
            document.body.style.background = '#fffbed';
            quizSection.style.display = 'flex';
            displayQuiz(count);
        } else {
            console.error("Could not find a valid JSON object in the AI's response.");
            alert("Sorry, there was an error generating the quiz. Please try again.");
        }

    } catch (error) {
        console.error("Error fetching or parsing quiz questions:", error);
        alert("Sorry, there was an error generating the quiz. Please try again.");
    }
}

function displayQuiz(count) {

    nextButton.style.display = 'none';
    options.forEach(option => option.style.backgroundColor = '#f4f4f4');
    options.forEach(opt => opt.style.pointerEvents = 'auto');

    question.textContent = quizData.questions[count].text;
    options.forEach(option => {
        options[0].textContent = quizData.questions[count].options[0];
        options[1].textContent = quizData.questions[count].options[1];
        options[2].textContent = quizData.questions[count].options[2];
        options[3].textContent = quizData.questions[count].options[3];
    });

    options.forEach(option => {
        option.addEventListener('click', () => {
            if ( option.textContent === quizData.questions[count].correctAnswer ) {
                score++;
                option.style.backgroundColor = 'green';
            } else {
                option.style.backgroundColor = 'red';
            }
            nextButton.style.display = 'block';
            options.forEach(opt => opt.style.pointerEvents = 'none');
        });
    });
}

nextButton.addEventListener('click', () => {
    count++;
    if (count < quizData.questions.length) {
        displayQuiz(count);
    } else {
        evaluateQuiz();
    }
});

function evaluateQuiz() {
    quizSection.style.display = 'none';
    resultSection.style.display = 'flex';
    resultSection.innerHTML = `
        <h2 id='quiz-completed'>Quiz Completed!</h2>
        <p id='quiz-score'>Your Score: ${score} out of ${quizData.questions.length}</p>
        <button id="new-btn">New Quiz</button>
    `;
    const newButton = document.getElementById('new-btn');
    newButton.addEventListener('click', () => {
        videoSearch.style.display = 'flex';
        resultSection.style.display = 'none';
        count = 0;
        score = 0;
    });
}