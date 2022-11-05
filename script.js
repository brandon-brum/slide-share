let role
let call
let peerConn
let peerID
let initialConstraints = null

let logo = document.getElementById("logo")
let videoElem = document.getElementById("streamvideo")
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
    console.log("calling " + conn.peer)
    if (videoElem.srcObject != null) call = me.call(conn.peer, videoElem.srcObject);
    conn.on('data', function(data) {
      console.log(data)
      if (data.charAt(0) == "!") {
        switch (data.charAt(1)) {
          case "Q":
            changeQuality(parseFloat(data.substring(3)) / 100)
            qualitySlider.value = parseFloat(data.substring(3)) / 100
            qualityValue.innerText = Math.round(qualitySlider.value*100) + "%"
            break
        }
      } else if (data.charAt(0) == "$") {
        addMessage(data.substring(2), false)
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

  startButton.onclick = function() {
    navigator.mediaDevices.getDisplayMedia()

    .then(stream => {
      settingsSection.style.display = "block"
      if (videoElem.srcObject != undefined) {videoElem.srcObject.getTracks().forEach((track) => track.stop())}
      
      videoElem.srcObject = stream
      startButton.innerText = "Change Source"
      nothingPlaying.style.display = "none"
      if (peerID == undefined) return
      if (call != undefined) {
        call.close()
        console.log('Recalling ' + peerID)
      } else {
        console.log('calling ' + peerID)
      }
      call = me.call(peerID, videoElem.srcObject);

    })
        
    .catch (err => {
        return
    })
  }
}

stopAllTracks = () => {if (videoElem.srcObject != undefined) {videoElem.srcObject.getTracks().forEach((track) => track.stop())}}

function onReceiveButton() {
  role = "Client"
  let me = new Peer()
  console.log("joining")
  SetTitle("Client - Enter Host ID")

  me.on('error', function(error) {
    console.error(error)
  });
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
    })
    conn.on('data', function(data) {
      if (data.charAt(0) == "!") {
        switch (data.charAt(1)) {
          case "Q":
            qualitySlider.value = parseFloat(data.substring(3)) / 100
            qualityValue.innerText = Math.round(qualitySlider.value*100) + "%"
            break
        }
      } else if (data.charAt(0) == "$") {
        addMessage(data.substring(2), false)
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
      call.answer();
      call.on('stream', function(stream) {
        settingsSection.style.display = "block"
        videoElem.srcObject = stream
        nothingPlaying.style.display = "none"
      });
    });
  roleSection.style.display = "none"
  idSection.style.display = "block"
  idLabel.innerText = "Your Host's IDentificator is:"
}

function SetTitle(text) {
  titleElem.innerText = text
  asideHeading.innerText = text

}

function changeQuality(value) {
  console.log(value)
  track = videoElem.srcObject.getVideoTracks()[0]
  initialConstraints = initialConstraints || track.getSettings()
  let newConstraints = structuredClone(initialConstraints)
  newConstraints.width = initialConstraints.width * value
  newConstraints.height = newConstraints.width * (1/initialConstraints.aspectRatio)
  videoElem.srcObject.getVideoTracks()[0].applyConstraints(newConstraints)
}
let qualitySlider = document.getElementById("qualitySlider")
let qualityValue = document.getElementById("qualityValue")

qualitySlider.oninput = function() {
  qualityValue.innerText = Math.round(qualitySlider.value*100) + "%"
}

qualitySlider.onchange = function() {
  if (role == "Host") {
    changeQuality(qualitySlider.value)
  } else {
    
  }
  peerConn.send("!Q:" + Math.round(qualitySlider.value*100))
}

chatBox.onkeypress = function(e) {
  if (e.key == "Enter" && !e.shiftKey) {
    peerConn.send("$:" + chatBox.innerText)
    addMessage(chatBox.innerText, true)
    chatBox.innerText = ""
    e.preventDefault()
  } 
}

function addMessage(text, self) {
  let textElem = document.createElement("p")
  let textSpan = document.createElement("span")
  textElem.className = self ? "self" : "peer"
  textSpan.innerText = text
  textElem.append(textSpan)
  chatContents.append(textElem)
}

