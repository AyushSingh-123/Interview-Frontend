class VoiceInterviewApp {
  constructor() {
    this.startBtn = document.getElementById('start-interview-btn');
    this.stopBtn = document.getElementById('stop-interview-btn');
    this.interviewContainer = document.getElementById('interview-container');
    this.conversationHistory = document.getElementById('conversation-history');
    this.listeningStatus = document.getElementById('listening-status');
    this.speakingStatus = document.getElementById('speaking-status');
    this.userVideo = document.getElementById('user-video');
    this.faceCanvas = document.getElementById('face-canvas');
    this.userInput = document.getElementById('user-input');
    this.sendButton = document.getElementById('send-button');
    this.faceStatus = document.getElementById('face-status');
    this.audioStatus = document.getElementById('audio-status');
    this.typingStatus = document.getElementById('typing-status');
    this.responseStatus = document.getElementById('response-status');
    this.warningMessages = document.getElementById('warning-messages');
    
    this.isInterviewActive = false;
    this.websocket = null;
    this.lastKeystrokeTime = Date.now();
    this.keystrokeBuffer = [];
    this.lastVideoCheck = Date.now();
    this.lastAudioCheck = Date.now();
    this.faceApiInitialized = false;
    this.lastBotMessage = null;
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.voiceBtn = document.getElementById('voice-btn');
    this.faceDetectionMisses = 0;
    this.maxFaceDetectionMisses = 3; // Number of misses before showing error
    
    this.initializeApp();
  }

  async initializeApp() {
    try {
      // Load face-api.js models
      await this.initializeFaceAPI();
      
      // Initialize camera and audio
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: true 
      });
      this.userVideo.srcObject = stream;
      this.videoTrack = stream.getVideoTracks()[0];
      this.audioTrack = stream.getAudioTracks()[0];

      // Setup event listeners
      this.startBtn.addEventListener('click', () => this.startInterview());
      this.stopBtn.addEventListener('click', () => this.endInterview());
      this.sendButton.addEventListener('click', () => this.sendUserInput());
      this.userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.sendUserInput();
        }
        this.recordKeystroke(e);
      });
      this.voiceBtn.addEventListener('click', () => {
        if (this.isListening) {
          this.stopListening();
        } else {
          this.startListening();
        }
      });

      // Start monitoring loops when interview is active
      setInterval(() => {
        if (this.isInterviewActive) {
          this.checkVideo();
          this.checkAudio();
          this.sendTypingData();
        }
      }, 1000);

    } catch (error) {
      console.error('Error initializing app:', error);
      this.addMessageToHistory('System Error: Failed to initialize application', 'error');
    }
  }

  async initializeFaceAPI() {
    try {
      // Load the face-api.js models from CDN
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1/model/';
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
      this.faceApiInitialized = true;
      console.log('Face API initialized successfully');
    } catch (error) {
      console.error('Error loading face-api.js models:', error);
      this.faceApiInitialized = false;
    }
  }

  recordKeystroke(event) {
    const now = Date.now();
    const timeSinceLastStroke = now - this.lastKeystrokeTime;
    
    this.keystrokeBuffer.push({
      key: event.key,
      timestamp: now,
      timeSinceLastStroke
    });
    
    // Check for suspicious typing patterns
    if (timeSinceLastStroke < 10) { // Very fast typing
      this.updateMonitorStatus('typing', 'warning', 'Unusually fast typing detected');
    } else if (this.keystrokeBuffer.length > 50 && 
               this.keystrokeBuffer.every(k => k.timeSinceLastStroke < 20)) {
      this.updateMonitorStatus('typing', 'error', 'Potential copy-paste detected');
    } else {
      this.updateMonitorStatus('typing', 'ok');
    }
    
    this.lastKeystrokeTime = now;
  }

  async checkVideo() {
    if (!this.faceApiInitialized) {
      console.log('Face API not initialized yet');
      return;
    }
    
    if (Date.now() - this.lastVideoCheck < 1000) {
      return;
    }
    
    try {
      console.log('Checking video...');
      const displaySize = { 
        width: this.userVideo.videoWidth,
        height: this.userVideo.videoHeight
      };

      const canvas = this.faceCanvas;
      const context = canvas.getContext('2d');
      
      // Clear previous drawings
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Set canvas size to match video
      canvas.width = displaySize.width;
      canvas.height = displaySize.height;

      console.log('Running face detection...');
      const detections = await faceapi.detectAllFaces(
        this.userVideo,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks().withFaceExpressions();

      console.log('Face detections:', detections);

      // Draw face detections
      detections.forEach(detection => {
        const box = detection.detection.box;
        
        // Draw face box with animated glow effect
        const glowIntensity = (Math.sin(Date.now() / 500) + 1) * 5; // Pulsing glow effect
        context.strokeStyle = '#2196f3';
        context.lineWidth = 2;
        context.shadowColor = '#2196f3';
        context.shadowBlur = 10 + glowIntensity;
        
        // Draw corners instead of full box for a more modern look
        const cornerLength = 20;
        
        // Top-left corner
        context.beginPath();
        context.moveTo(box.x, box.y + cornerLength);
        context.lineTo(box.x, box.y);
        context.lineTo(box.x + cornerLength, box.y);
        context.stroke();
        
        // Top-right corner
        context.beginPath();
        context.moveTo(box.x + box.width - cornerLength, box.y);
        context.lineTo(box.x + box.width, box.y);
        context.lineTo(box.x + box.width, box.y + cornerLength);
        context.stroke();
        
        // Bottom-left corner
        context.beginPath();
        context.moveTo(box.x, box.y + box.height - cornerLength);
        context.lineTo(box.x, box.y + box.height);
        context.lineTo(box.x + cornerLength, box.y + box.height);
        context.stroke();
        
        // Bottom-right corner
        context.beginPath();
        context.moveTo(box.x + box.width - cornerLength, box.y + box.height);
        context.lineTo(box.x + box.width, box.y + box.height);
        context.lineTo(box.x + box.width, box.y + box.height - cornerLength);
        context.stroke();
        
        // Draw landmarks with pulsing effect
        if (detection.landmarks) {
          const landmarkSize = (Math.sin(Date.now() / 500) + 1.5) * 1.5;
          context.fillStyle = '#4caf50';
          context.shadowColor = '#4caf50';
          context.shadowBlur = 5;
          
          detection.landmarks.positions.forEach(point => {
            context.beginPath();
            context.arc(point.x, point.y, landmarkSize, 0, 2 * Math.PI);
            context.fill();
          });
        }

        // Draw expressions with a modern UI
        if (detection.expressions) {
          const expressions = detection.expressions;
          const dominantExpression = Object.keys(expressions).reduce((a, b) => 
            expressions[a] > expressions[b] ? a : b
          );
          
          // Draw expression background
          const expressionWidth = 120;
          const expressionHeight = 30;
          const expressionX = box.x + (box.width - expressionWidth) / 2;
          const expressionY = box.y - expressionHeight - 10;
          
          // Draw background with gradient
          const gradient = context.createLinearGradient(
            expressionX, expressionY,
            expressionX + expressionWidth, expressionY
          );
          gradient.addColorStop(0, 'rgba(33, 150, 243, 0.9)');
          gradient.addColorStop(1, 'rgba(33, 150, 243, 0.7)');
          
          context.fillStyle = gradient;
          context.beginPath();
          context.roundRect(expressionX, expressionY, expressionWidth, expressionHeight, 8);
          context.fill();
          
          // Draw expression text
          context.fillStyle = '#fff';
          context.font = 'bold 14px Arial';
          context.textAlign = 'center';
          context.fillText(
            `${dominantExpression.toUpperCase()}`,
            expressionX + expressionWidth / 2,
            expressionY + 12
          );
          
          // Draw confidence percentage
          context.font = '12px Arial';
          context.fillText(
            `${Math.round(expressions[dominantExpression] * 100)}%`,
            expressionX + expressionWidth / 2,
            expressionY + 26
          );
        }
      });

      if (detections.length === 0) {
        console.log('No face detected');
        this.updateMonitorStatus('face', 'error', 'No face detected');
      } else if (detections.length > 1) {
        console.log('Multiple faces detected:', detections.length);
        this.updateMonitorStatus('face', 'error', 'Multiple faces detected');
      } else if (this.isLookingAway(detections[0])) {
        console.log('Face looking away');
        this.updateMonitorStatus('face', 'warning', 'Looking away from camera');
      } else {
        console.log('Face detection OK');
        this.updateMonitorStatus('face', 'ok');
      }

      // Request next animation frame to keep the visual effects smooth
      requestAnimationFrame(() => this.checkVideo());

      const frameData = {
        face_count: detections.length,
        looking_away: detections.length > 0 && this.isLookingAway(detections[0])
      };
      
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({
          type: 'video_frame',
          data: frameData
        }));
      }
      
      this.lastVideoCheck = Date.now();
    } catch (error) {
      console.error('Error checking video:', error);
      this.updateMonitorStatus('face', 'error', 'Error analyzing video');
    }
  }

  async checkAudio() {
    if (Date.now() - this.lastAudioCheck < 1000) return;
    
    try {
      console.log('Checking audio...');
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(
        new MediaStream([this.audioTrack])
      );
      microphone.connect(analyser);
      
      const dataArray = new Float32Array(analyser.frequencyBinCount);
      analyser.getFloatTimeDomainData(dataArray);
      
      const voiceCount = this.estimateVoiceCount(dataArray);
      const hasBackgroundSpeech = this.detectBackgroundSpeech(dataArray);

      console.log('Audio analysis:', { voiceCount, hasBackgroundSpeech });

      if (voiceCount > 1) {
        console.log('Multiple voices detected');
        this.updateMonitorStatus('audio', 'error', 'Multiple voices detected');
      } else if (hasBackgroundSpeech) {
        console.log('Background speech detected');
        this.updateMonitorStatus('audio', 'warning', 'Background conversation detected');
      } else {
        console.log('Audio OK');
        this.updateMonitorStatus('audio', 'ok');
      }
      
      const audioData = {
        voice_count: voiceCount,
        background_speech: hasBackgroundSpeech
      };
      
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({
          type: 'audio_data',
          data: audioData
        }));
      }
      
      this.lastAudioCheck = Date.now();
      audioContext.close();
    } catch (error) {
      console.error('Error checking audio:', error);
      this.updateMonitorStatus('audio', 'error', 'Error analyzing audio');
    }
  }

  sendTypingData() {
    if (this.keystrokeBuffer.length > 0) {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({
          type: 'typing_data',
          data: this.keystrokeBuffer
        }));
      }
      this.keystrokeBuffer = [];
    }
  }

  isLookingAway(detection) {
    if (!detection || !detection.landmarks) return false;
    
    const landmarks = detection.landmarks.positions;
    
    // Get eye positions
    const leftEye = landmarks[36]; // Left eye outer corner
    const rightEye = landmarks[45]; // Right eye outer corner
    
    // Calculate eye distance relative to face width
    const faceWidth = detection.detection.box.width;
    const eyeDistance = Math.abs(rightEye.x - leftEye.x);
    const eyeDistanceRatio = eyeDistance / faceWidth;
    
    // If ratio is too small, person is likely looking away
    return eyeDistanceRatio < 0.2;
  }

  estimateVoiceCount(audioData) {
    // Simple voice counting using frequency analysis
    let voices = 1;
    const frequencies = new Set();
    
    for (let i = 0; i < audioData.length; i++) {
      if (Math.abs(audioData[i]) > 0.1) {
        frequencies.add(Math.round(audioData[i] * 100));
      }
    }
    
    if (frequencies.size > 100) voices = 2;
    if (frequencies.size > 200) voices = 3;
    
    return voices;
  }

  detectBackgroundSpeech(audioData) {
    // Detect if there's significant audio in background frequencies
    let backgroundNoise = 0;
    
    for (let i = 0; i < audioData.length; i++) {
      if (Math.abs(audioData[i]) > 0.05) {
        backgroundNoise++;
      }
    }
    
    return backgroundNoise > audioData.length * 0.3;
  }

  async sendUserInput() {
    const text = this.userInput.value.trim();
    if (text && this.isInterviewActive) {
      const responseTime = Date.now() - this.lastBotMessage;
      const wordsPerMinute = (text.split(' ').length / (responseTime / 1000)) * 60;
      
      if (wordsPerMinute > 200) {
        this.updateMonitorStatus('response', 'error', 'Suspiciously fast response');
      } else if (wordsPerMinute > 100) {
        this.updateMonitorStatus('response', 'warning', 'Unusually quick response');
      } else {
        this.updateMonitorStatus('response', 'ok');
      }

      this.userInput.disabled = true;
      this.sendButton.disabled = true;
      
      try {
        await this.handleUserResponse(text);
      } finally {
        this.userInput.value = '';
        this.userInput.disabled = false;
        this.sendButton.disabled = false;
        this.userInput.focus();
      }
    }
  }

  async handleBotResponse(text) {
    this.addMessageToHistory(text, 'bot');
    this.speakingStatus.textContent = 'Bot: Message Received';
    this.lastBotMessage = Date.now();
    this.speakText(text);
  }

  updateMonitorStatus(type, status, message = '') {
    console.log(`Monitoring Update - Type: ${type}, Status: ${status}, Message: ${message}`);
    
    const statusElement = {
      'face': this.faceStatus,
      'audio': this.audioStatus,
      'typing': this.typingStatus,
      'response': this.responseStatus
    }[type];

    if (!statusElement) {
      console.error(`Status element not found for type: ${type}`);
      return;
    }

    console.log(`Updating status element:`, statusElement);

    // Update status indicator
    statusElement.className = 'monitor-status status-' + status;
    statusElement.textContent = status.toUpperCase();

    // Show warning message if needed
    if (message && (status === 'warning' || status === 'error')) {
      console.log('Creating warning message:', message);
      const warningDiv = document.createElement('div');
      warningDiv.className = 'warning-message';
      warningDiv.textContent = message;
      this.warningMessages.appendChild(warningDiv);
      
      // Make the warning visible with animation
      setTimeout(() => {
        console.log('Making warning visible');
        warningDiv.classList.add('visible');
      }, 10);
      
      // Remove the warning after 5 seconds
      setTimeout(() => {
        console.log('Removing warning');
        warningDiv.classList.remove('visible');
        setTimeout(() => warningDiv.remove(), 300);
      }, 5000);
    }
  }

  async startInterview() {
    try {
      this.websocket = new WebSocket('ws://127.0.0.1:5000/ws');
      
      this.websocket.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'bot_response') {
          await this.handleBotResponse(message.text);
          
          if (message.text.includes('=== Interview Feedback ===')) {
            this.handleInterviewEnd();
          }
        } else if (message.type === 'error') {
          this.addMessageToHistory(message.text, 'error');
        }
      };

      this.websocket.onopen = () => {
        this.isInterviewActive = true;
        this.startBtn.disabled = true;
        this.stopBtn.disabled = false;
        this.userInput.disabled = false;
        this.sendButton.disabled = false;
        this.listeningStatus.textContent = 'Connected: Ready for input';
        this.userInput.focus();
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.addMessageToHistory('Connection Error: Failed to connect to interview server', 'error');
      };

      this.websocket.onclose = () => {
        if (this.isInterviewActive) {
          this.stopInterview();
        }
      };
    } catch (error) {
      console.error('Error starting interview:', error);
      this.addMessageToHistory('System Error: Failed to start interview', 'error');
    }
  }

  async endInterview() {
    if (this.isInterviewActive) {
      await this.handleUserResponse('end interview');
    }
  }

  async stopInterview() {
    try {
      if (this.websocket) {
        this.websocket.close();
      }

      this.isInterviewActive = false;
      this.startBtn.disabled = false;
      this.stopBtn.disabled = true;
      this.userInput.disabled = true;
      this.sendButton.disabled = true;
      this.listeningStatus.textContent = 'Not Connected';
      this.speakingStatus.textContent = 'Bot: Not Active';
    } catch (error) {
      console.error('Error stopping interview:', error);
    }
  }

  handleInterviewEnd() {
    this.isInterviewActive = false;
    this.startBtn.disabled = false;
    this.stopBtn.disabled = true;
    this.userInput.disabled = true;
    this.sendButton.disabled = true;
    this.listeningStatus.textContent = 'Interview Completed';
    this.speakingStatus.textContent = 'Bot: Interview Ended';
  }

  async handleUserResponse(text) {
    this.addMessageToHistory(text, 'user');
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({ 
        type: 'user_response', 
        text 
      }));
    }
  }

  addMessageToHistory(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    messageDiv.textContent = text;
    this.conversationHistory.appendChild(messageDiv);
    this.conversationHistory.scrollTop = this.conversationHistory.scrollHeight;
  }

  initializeSpeechRecognition() {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.userInput.value = transcript;
        this.sendUserInput();
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        this.stopListening();
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          this.recognition.start();
        }
      };
    } else {
      console.error('Speech recognition not supported');
    }
  }

  startListening() {
    if (this.recognition) {
      this.isListening = true;
      this.recognition.start();
      this.voiceBtn.classList.add('active');
    }
  }

  stopListening() {
    if (this.recognition) {
      this.isListening = false;
      this.recognition.stop();
      this.voiceBtn.classList.remove('active');
    }
  }

  speakText(text) {
    if (this.synthesis) {
      // Stop any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      this.synthesis.speak(utterance);
    }
  }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
  const app = new VoiceInterviewApp();
  app.initializeSpeechRecognition();
});