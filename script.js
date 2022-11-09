let role
let videoCall
let audioCall
let audioStream
let peerConn
let peerID
let initialConstraints = {audio: {}, video: {}}

let logo = document.getElementById("logo")
let videoElem = document.getElementById("streamVideo")
let audioElem = document.getElementById("microphoneAudio")
let audioAmp
let titleElem = document.getElementsByTagName("title")[0]

let startButton = document.getElementById("startButton")
let nothingPlaying = document.getElementById("nothingPlaying")
let idSection = document.getElementById("idSection")
let idBox = document.getElementById("idBox")
let idLabel = document.getElementById("idLabel")
let asideHeading = document.getElementById("asideHeading")
let settingsSection = document.getElementById("settingsSection")
let roleSection = document.getElementById("roleSection")
let chatSection = document.getElementById("chatSection")
let chatBox = document.getElementById("chatBox")
let chatContents = document.getElementById("chatContents")

function onShareButton() {
  role = "Host"
  let me = new Peer()
  console.log('hosting')
  SetTitle("Host - Connecting...")
  idBox.readonly = true
  roleSection.style.display = "none"
  idSection.style.display = "block"
  idLabel.innerText = "Your IDentificator is:"
  startButton.innerText = "Select Source"
  logo.style.display = "none"
  settingsSection.style.display = "block"
  me.on("open", function(id) {
    SetTitle("Host - Waiting for Client...")
    idBox.value = me.id
  })

  me.on('connection', function(conn) {
    peerConn = conn
    peerID = conn.peer
    chatSection.style.display = "flex"
    console.log("connected!")
    SetTitle("Host - Connected")
    console.log("videoCalling " + conn.peer)
    settingsSection.style.display = "block"
    if (videoElem.srcObject != null) videoCall = me.call(conn.peer, videoElem.srcObject);
    audioCall = me.call(conn.peer, audioStream);

    audioCall.on("stream", stream => {
      audioElem.srcObject = stream;
    })

    conn.on('data', function(data) {
      console.log(data)
      if (data.charAt(0) == "!") {
        let dataValue = data.substring(4)
        switch (data.substring(1,3)) {
          case "VQ":
            changeVideoQuality(parseFloat(dataValue / 100))
            videoQualitySlider.value = parseFloat(dataValue / 100)
            videoQualityValue.innerText = Math.round(videoQualitySlider.value*100) + "%"
          break
          case "MQ":
            changeMicrophoneQuality(parseFloat(dataValue / 100))
            microphoneQualitySlider.value = parseFloat(dataValue / 100)
            microphoneQualityValue.innerText = Math.round(microphoneQualitySlider.value*100) + "%"
          break
        }
      } else if (data.charAt(0) == "$") {
        showMessage(data.substring(2), false)
      }
    });
    conn.on('error', function(error) {
      console.error(error)
    });

    conn.on('close', function () {
      SetTitle("Host - Disconnected")
    })
  });

  me.on('error', function(error) {
    console.error(error)
  });

  navigator.mediaDevices.getUserMedia({audio:true})

    .then(stream => {
      audioStream = stream
      if (peerID == undefined) return
      audioCall = me.call(peerID, audioStream);
    })

    .catch (err => console.error(err))

  startButton.onclick = function() {
    navigator.mediaDevices.getDisplayMedia()

    .then(stream => {
      settingsSection.style.display = "block"
      if (videoElem.srcObject != undefined) {videoElem.srcObject.getTracks().forEach((track) => track.stop())}
      
      videoElem.srcObject = stream
      initialConstraints.video = stream.getVideoTracks()[0].getSettings()
      startButton.innerText = "Change Source"
      nothingPlaying.style.display = "none"
      if (peerID == undefined) return
      if (videoCall != undefined) {
        videoCall.close()
        console.log('RevideoCalling ' + peerID)
      } else {
        console.log('videoCalling ' + peerID)
      }
      videoCall = me.call(peerID, videoElem.srcObject);

    })
        
    .catch (err => console.error(err))
  }
}

stopAllTracks = () => {if (videoElem.srcObject != undefined) {videoElem.srcObject.getTracks().forEach((track) => track.stop())}}

function onWatchButton() {
  role = "Client"
  let me = new Peer()
  console.log("joining")
  SetTitle("Client - Enter Host ID")

  me.on('error', function(error) {
    console.error(error)
  });

  navigator.mediaDevices.getUserMedia({audio:true})

  .then(stream => {
    audioStream = stream
  })

  startButton.onclick = function() {
    if (idBox.value == "") return
    SetTitle("Client - Connecting...")
    let conn = me.connect(idBox.value, {reliable: true})
    peerConn = conn
    
    conn.on('open', function() {
      console.log("connected!")
      SetTitle("Client - Connected")
      logo.style.display = "none"
      chatSection.style.display = "flex"
      startButton.style.display = "none"
      settingsSection.style.display = "block"
    })
    conn.on('data', function(data) {
      if (data.charAt(0) == "!") {
        let dataValue = data.substring(4)
        switch (data.substring(1,3)) {
          case "VQ":
            videoQualitySlider.value = parseFloat(dataValue / 100)
            videoQualityValue.innerText = Math.round(videoQualitySlider.value*100) + "%"
          break
          case "MQ":
            changeMicrophoneQuality(parseFloat(dataValue / 100))
            microphoneQualitySlider.value = parseFloat(dataValue / 100)
            microphoneQualityValue.innerText = Math.round(microphoneQualitySlider.value*100) + "%"
          break
        }
      } else if (data.charAt(0) == "$") {
        showMessage(data.substring(2), false)
      }
    })
    conn.on('error', function(error) {
      console.log(error)
    });

    conn.on('close', function() {
      SetTitle("Client - Disconnected")
    })
  }
    me.on('call', function(call) {
      console.log('Getting a stream call...')
      call.answer(audioStream);
      call.on('stream', function(stream) {
        if (stream.getVideoTracks()[0]) {
          settingsSection.style.display = "block"
          nothingPlaying.style.display = "none"
          videoElem.srcObject = stream;
        } else {
          audioElem.srcObject = stream;
        }
      });
    });
  roleSection.style.display = "none"
  idSection.style.display = "block"
  idLabel.innerText = "Your Host's IDentificator is:"
}

let chatWindow = null;

function SetTitle(text) {
  titleElem.innerText = text
  asideHeading.innerText = text

}

function changeVideoQuality(value) {
  track = videoElem.srcObject.getVideoTracks()[0]
  if (!track) return
  console.log("value:" + value)
  console.log("Initial:", initialConstraints)
  let newConstraints = structuredClone(initialConstraints.video)
  console.log("New:", newConstraints)
  newConstraints.width = initialConstraints.video.width * value
  newConstraints.height = newConstraints.width * (1/initialConstraints.video.aspectRatio)
  console.log("New:", newConstraints)
  videoElem.srcObject.getVideoTracks()[0].applyConstraints(newConstraints)
}

let videoQualitySlider = document.getElementById("videoQualitySlider")
let videoQualityValue = document.getElementById("videoQualityValue")

videoQualitySlider.oninput = function() {
  videoQualityValue.innerText = Math.round(videoQualitySlider.value*100) + "%"
}

videoQualitySlider.onchange = function() {
  if (role == "Host") {
    changeVideoQuality(videoQualitySlider.value)
  } else {
    
  }
  if (peerConn) peerConn.send("!VQ:" + Math.round(videoQualitySlider.value*100))
}

/*function changeMicrophoneQuality(value) {
  track = videoElem.srcObject.getAudioTracks()[0]
  if (!track) return
  initialConstraints.audio = initialConstraints.audio || track.getSettings()
  let newConstraints = structuredClone(initialConstraints.audio)
  newConstraints.sampleRate = Math.round(initialConstraints.audio.sampleRate * value)
  newConstraints.sampleSize = Math.round(initialConstraints.audio.sampleSize * value)
  videoElem.srcObject.getAudioTracks()[0].applyConstraints(newConstraints)
}

let microphoneQualitySlider = document.getElementById("microphoneQualitySlider")
let microphoneQualityValue = document.getElementById("microphoneQualityValue")

microphoneQualitySlider.oninput = function() {
  microphoneQualityValue.innerText = Math.round(videoQualitySlider.value*100) + "%"
}
*/

let microphoneVolumeSlider = document.getElementById("microphoneVolumeSlider")
let microphoneVolumeValue = document.getElementById("microphoneVolumeValue")

microphoneVolumeSlider.oninput = function() {
  microphoneVolumeValue.innerText = Math.round(microphoneVolumeSlider.value*100) + "%"
  audioElem.volume = microphoneVolumeSlider.value
}

chatBox.onkeypress = function(e) {
  if (e.key == "Enter" && !e.shiftKey) {
    if (chatBox.innerText == "") {
      e.preventDefault()
      return
    }
    chatBox.innerText = chatBox.innerText.trim()
    sendMessage(chatBox.innerText)
    showMessage(chatBox.innerText, true)
    chatBox.innerText = ""
    e.preventDefault()
  } 
}

let isTextToSpeech = false
let textToSpeechButton = document.getElementById("textToSpeechButton")

textToSpeechButton.onclick = function() {
  isTextToSpeech = !isTextToSpeech
  textToSpeechButton.childNodes[0].innerText = isTextToSpeech ? "🕬" : "🕫"
}

let isMuted = false
let muteButton = document.getElementById("microphoneButton")

muteButton.onclick = function() {
  if (audioStream) {
    isMuted = !isMuted
    audioStream.getAudioTracks()[0].enabled = !isMuted
    muteButton.childNodes[0].src = "resources/" + (isMuted ? "mutedmicrophone.png" : "microphone.png")
    if (peerConn && isMuted) peerConn.send("!MM")
  }
  
}

function showMessage(text, self) {
  let textElem = document.createElement("p")
  let textSpan = document.createElement("span")
  textElem.className = self ? "self" : "peer"
  textSpan.innerText = text
  textElem.append(textSpan)
  if ((chatContents.offsetHeight + chatContents.scrollTop) - chatContents.scrollHeight < 10) {
    chatContents.append(textElem)
    chatContents.scrollBy(0,9999)
  } else {
    chatContents.append(textElem)
  }
  if (chatWindow) chatWindow.showMessage(text, self)
  if (!self && isTextToSpeech) speechSynthesis.speak(new SpeechSynthesisUtterance(text)) 
}

function sendMessage(text) {
  if (peerConn && text) peerConn.send("$:" + text)
}

let chatPopOutButton = document.getElementById("chatPopOutButton");

chatPopOutButton.onclick = function() {
  chatWindow = window.open("chatWindow/chatWindow.html","chatWindow",
  `popup location=no width=300 height=9999 scrollbars=no,status=no,location=no,toolbar=no,menubar=no`);

  chatWindow.broadcast = new BroadcastChannel(broadcast.name)

  chatWindow.onclose = function () {
    chatWindow = null
  }
}

let broadcast = new BroadcastChannel("SlideShareChat" + new Date().getTime())

/*broadcast.onmessage = function(e) {
  if (e.data.charAt(0) == "$") showMessage(e.data.substring(2), true)
}*/

window.onbeforeunload = function(){
  if (chatWindow) chatWindow.close()
}