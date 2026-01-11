import { joinRoom } from 'https://esm.run/trystero'

let role
let videoCall
let audioCall
let audioStream
let peerConn
let peerID
let initialConstraints = { audio: { noiseSuppression: true }, video: {} }

let idPrefix = "65c7adf7-13ff-45ca-87b5-3f8e3f356b7e-"
let currentSecond = Math.round(new Date().getTime() / 1000) % 86400
let idSuffix = currentSecond + Math.floor(Math.random() * (13599 - 10000) + 10000)
let finalID = idPrefix + idSuffix

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

let url = new URL(window.location)
let roomID = url.searchParams.get("r")
let room

if (roomID != null) {
  if (window.history.state != "host") {
    console.log("automatically entering room " + roomID)
    idBox.value = roomID
    onWatchButton()
  } else {
    window.history.replaceState(null, '', window.location.pathname)
  }

}

document.getElementById("shareButton").onclick = onShareButton


function onShareButton() {
  role = "Host"
  //let me = new Peer(finalID)
  room = joinRoom({ appId: 'bb_ghio_slideshare-rnatc' }, finalID)
  let [sendData, getData] = room.makeAction('data')
  room.sendData = sendData
  room.getData = getData
  console.log('hosting')
  SetTitle("Host - Connecting...")
  idBox.readOnly = true
  roleSection.style.display = "none"
  idSection.style.display = "block"
  idLabel.innerText = "Your IDentificator is:"
  startButton.innerText = "Select Source"
  logo.style.display = "none"
  settingsSection.style.display = "block"
  videoElem.volume = 0
  /*me.on("open", function (id) {*/
  SetTitle("Host - Waiting for Client...")
  idBox.value = finalID.replace(idPrefix, "")
  window.history.replaceState("host", null, "?r=" + idBox.value)
  /*})*/

  room.onPeerJoin(peerID => {
    chatSection.style.display = "flex"
    console.log("connected!")
    SetTitle("Host - Connected")
    console.log("videoCalling " + peerID)
    settingsSection.style.display = "block"
    if (videoElem.srcObject != null) videoCall = room.addStream(videoElem.srcObject, null, "screenshare")
    audioCall = room.addStream(audioStream, null, "microphone")

    room.onPeerStream((stream, peerID, meta) => {
      if (meta == "microphone")
        audioElem.srcObject = stream
    })

    room.getData(data => {
      //console.log("received" + data)
      if (data.charAt(0) == "!") {
        let dataValue = data.substring(4)
        switch (data.substring(1, 3)) {
          case "VQ":
            changeVideoQuality(parseFloat(dataValue / 100))
            videoQualitySlider.value = parseFloat(dataValue / 100)
            videoQualityValue.innerText = Math.round(videoQualitySlider.value * 100) + "%"
            break
          case "VF":
            changeVideoFrameRate(dataValue)
            frameRateSlider.value = dataValue
            frameRateValue.innerText = frameRateSlider.value + "fps"
            break
        }
      } else if (data.charAt(0) == "$") {
        showMessage(data.substring(2), false)
      }
    })

    room.onPeerLeave(() => {
      SetTitle("Host - Disconnected")
    })
  })

  navigator.mediaDevices.getUserMedia({ audio: true })

    .then(stream => {
      audioStream = stream
      if (peerID == undefined) return
      audioCall = room.addStream(audioStream, null, "microphone")
    })

    .catch(err => console.error(err))

  startButton.onclick = function () {
    navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })

      .then(stream => {
        settingsSection.style.display = "block"
        //if (videoElem.srcObject != undefined) { videoElem.srcObject.getTracks().forEach((track) => track.stop()) }

        videoElem.srcObject = stream
        initialConstraints.video = stream.getVideoTracks()[0].getSettings()
        changeVideoFrameRate(frameRateSlider.value)
        changeVideoQuality(videoQualitySlider.value)
        startButton.innerText = "Change Source"
        nothingPlaying.style.display = "none"
        if (peerID == undefined) return
        if (videoCall != undefined) {
          room.removeStream(videoCall)
          console.log('RevideoCalling ' + peerID)
        } else {
          console.log('videoCalling ' + peerID)
        }
        videoCall = room.addStream(stream, null, "screenshare")

      })

      .catch(err => console.error(err))
  }
}

let stopAllTracks = () => { if (videoElem.srcObject != undefined) { videoElem.srcObject.getTracks().forEach((track) => track.stop()) } }

document.getElementById("watchButton").onclick = onWatchButton

function onWatchButton() {
  role = "Client"
  //me = new Peer()
  console.log("joining")
  SetTitle("Client - Enter Host ID")

  startButton.onclick = function () {
    if (idBox.value == "") return
    SetTitle("Client - Connecting...")
    //let conn = me.connect(idPrefix + idBox.value, { reliable: true })
    room = joinRoom({ appId: 'bb_ghio_slideshare-rnatc' }, idPrefix + idBox.value)

    let [sendData, getData] = room.makeAction('data')
    room.sendData = sendData
    room.getData = getData
    //peerConn = conn

    room.onPeerJoin(peerId => {
      console.log("connected!")
      SetTitle("Client - Connected")
      logo.style.display = "none"
      chatSection.style.display = "flex"
      startButton.style.display = "none"
      settingsSection.style.display = "block"
    })
    room.getData(data => {
      //console.log("received" + data)
      if (data.charAt(0) == "!") {
        let dataValue = data.substring(4)
        switch (data.substring(1, 3)) {
          case "VQ":
            videoQualitySlider.value = parseFloat(dataValue / 100)
            videoQualityValue.innerText = Math.round(videoQualitySlider.value * 100) + "%"
            break
          case "VF":
            frameRateSlider.value = dataValue
            frameRateValue.innerText = frameRateSlider.value + "fps"
            break
        }
      } else if (data.charAt(0) == "$") {
        showMessage(data.substring(2), false)
      }
    })

    room.onPeerLeave(() => {
      SetTitle("Client - Disconnected")
    })

    room.onPeerStream((stream, peerID, meta) => {
      console.log(stream, meta)
      console.log('Getting a stream call...')
      audioCall = room.addStream(audioStream, null, "microphone")
      if (stream.getVideoTracks().length) {
        settingsSection.style.display = "block"
        nothingPlaying.style.display = "none"
        videoElem.srcObject = stream
      } else if (stream.getAudioTracks().length) {
        audioElem.srcObject = stream
      }

    })
  }
  roleSection.style.display = "none"
  idSection.style.display = "block"
  idLabel.innerText = "Your Host's IDentificator is:"

  navigator.mediaDevices.getUserMedia({ audio: true })

    .then(stream => {
      audioStream = stream
    })

  if (roomID != null) {
    startButton.click()
  }
}

let chatWindow = null

function SetTitle(text) {
  titleElem.innerText = text
  asideHeading.innerText = text

}

function changeVideoQuality(value) {
  let track = videoElem.srcObject.getVideoTracks()[0]
  if (!track) return
  let newConstraints = structuredClone(initialConstraints.video)
  newConstraints.width = initialConstraints.video.width * value
  newConstraints.height = newConstraints.width * (1 / initialConstraints.video.aspectRatio)
  videoElem.srcObject.getVideoTracks()[0].applyConstraints(newConstraints)
}

let videoQualitySlider = document.getElementById("videoQualitySlider")
let videoQualityValue = document.getElementById("videoQualityValue")

videoQualitySlider.oninput = function () {
  videoQualityValue.innerText = Math.round(videoQualitySlider.value * 100) + "%"
}

videoQualitySlider.onchange = function () {
  if (role == "Host") {
    changeVideoQuality(videoQualitySlider.value)
  } else {

  }
  room.sendData("!VQ:" + Math.round(videoQualitySlider.value * 100))
}

function changeVideoFrameRate(value) {
  let track = videoElem.srcObject.getVideoTracks()[0]
  if (!track) return
  let oldConstraints = videoElem.srcObject.getVideoTracks()[0].getConstraints()
  let newConstraints = structuredClone(oldConstraints)
  newConstraints.frameRate = value
  initialConstraints.video.frameRate = value
  videoElem.srcObject.getVideoTracks()[0].applyConstraints(newConstraints)
}

let frameRateSlider = document.getElementById("frameRateSlider")
let frameRateValue = document.getElementById("frameRateValue")

frameRateSlider.oninput = function () {
  frameRateValue.innerText = frameRateSlider.value + "fps"
}

frameRateSlider.onchange = function () {
  if (role == "Host") {
    changeVideoFrameRate(frameRateSlider.value)
  } else {

  }
  room.sendData("!VF:" + frameRateSlider.value)
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

microphoneVolumeSlider.oninput = function () {
  microphoneVolumeValue.innerText = Math.round(microphoneVolumeSlider.value * 100) + "%"
  audioElem.volume = microphoneVolumeSlider.value
}

chatBox.onkeypress = function (e) {
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

textToSpeechButton.onclick = function () {
  isTextToSpeech = !isTextToSpeech
  textToSpeechButton.childNodes[0].innerText = isTextToSpeech ? "🕬" : "🕫"
}

let isMuted = false
let muteButton = document.getElementById("microphoneButton")

muteButton.onclick = function () {
  if (audioStream) {
    isMuted = !isMuted
    audioStream.getAudioTracks()[0].enabled = !isMuted
    muteButton.childNodes[0].src = "resources/" + (isMuted ? "mutedmicrophone.png" : "microphone.png")
    if (isMuted) room.sendData("!MM")
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
    chatContents.scrollBy(0, 9999)
  } else {
    chatContents.append(textElem)
  }
  if (chatWindow) chatWindow.showMessage(text, self)
  if (!self && isTextToSpeech) speechSynthesis.speak(new SpeechSynthesisUtterance(text))
}

function sendMessage(text) {
  if (text) room.sendData("$:" + text)
}

let chatPopOutButton = document.getElementById("chatPopOutButton")

chatPopOutButton.onclick = function () {
  chatWindow = window.open("chatWindow/chatWindow.html", "chatWindow",
    `popup location=no width=300 height=9999 scrollbars=no,status=no,location=no,toolbar=no,menubar=no`)

  chatWindow.broadcast = new BroadcastChannel(broadcast.name)

  chatWindow.onclose = function () {
    chatWindow = null
  }
}

let broadcast = new BroadcastChannel("SlideShareChat" + new Date().getTime())

/*broadcast.onmessage = function(e) {
  if (e.data.charAt(0) == "$") showMessage(e.data.substring(2), true)
}*/

window.onbeforeunload = function () {
  if (chatWindow) chatWindow.close()
}

let copyButton = document.getElementById("copyButton")

copyButton.onclick = e => navigator.clipboard.writeText(idBox.value)
