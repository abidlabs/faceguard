const video = document.getElementById("myvideo");
const handimg = document.getElementById("handimage");
// const canvas = document.getElementById("canvas");
// const context = canvas.getContext("2d");
let trackButton = document.getElementById("trackbutton");
let nextImageButton = document.getElementById("nextimagebutton");
let updateNote = document.getElementById("updatenote");

let imgindex = 1
let isVideo = false;
let model = null;

video.width = 400
video.height = 300

const modelParams = {
    flipHorizontal: true,   // flip e.g for video  
    maxNumBoxes: 20,        // maximum number of boxes to detect
    iouThreshold: 0.5,      // ioU threshold for non-max suppression
    scoreThreshold: 0.6,    // confidence threshold for predictions.
}

function startVideo() {
    handTrack.startVideo(video).then(function (status) {
        console.log("Video started")
        $('#user-message').html('Test me! Try touching your face')
        if (status) {
            // updateNote.innerText = "Video started. Now tracking"
            isVideo = true
            navigator.mediaDevices.enumerateDevices().then(gotDevices)
            runDetection()
        } else {
            // updateNote.innerText = "Please enable video"
        }
    });
}

function toggleVideo() {
    if (!isVideo) {
        // updateNote.innerText = "Starting video"
        startVideo();
    } else {
        // updateNote.innerText = "Stopping video"
        handTrack.stopVideo(video)
        isVideo = false;
        // updateNote.innerText = "Video stopped"
    }
}



// nextImageButton.addEventListener("click", function(){
//     nextImage();
// });

// trackButton.addEventListener("click", function(){
//     toggleVideo();
// });

function nextImage() {

    imgindex++;
    handimg.src = "images/" + imgindex % 15 + ".jpg"
    // alert(handimg.src)
    runDetectionImage(handimg)
}


var running_predictions = Array(10).fill(0)

function beep() {
    var snd = new Audio("data:audio/wav;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7xA4Tvh9Rz/y8QADBwMWgQAZG/ILNAARQ4GLTcDeIIIhxGOBAuD7hOfBB3/94gcJ3w+o5/5eIAIAAAVwWgQAVQ2ORaIQwEMAJiDg95G4nQL7mQVWI6GwRcfsZAcsKkJvxgxEjzFUgfHoSQ9Qq7KNwqHwuB13MA4a1q/DmBrHgPcmjiGoh//EwC5nGPEmS4RcfkVKOhJf+WOgoxJclFz3kgn//dBA+ya1GhurNn8zb//9NNutNuhz31f////9vt///z+IdAEAAAK4LQIAKobHItEIYCGAExBwe8jcToF9zIKrEdDYIuP2MgOWFSE34wYiR5iqQPj0JIeoVdlG4VD4XA67mAcNa1fhzA1jwHuTRxDUQ//iYBczjHiTJcIuPyKlHQkv/LHQUYkuSi57yQT//uggfZNajQ3Vmz+Zt//+mm3Wm3Q576v////+32///5/EOgAAADVghQAAAAA//uQZAUAB1WI0PZugAAAAAoQwAAAEk3nRd2qAAAAACiDgAAAAAAABCqEEQRLCgwpBGMlJkIz8jKhGvj4k6jzRnqasNKIeoh5gI7BJaC1A1AoNBjJgbyApVS4IDlZgDU5WUAxEKDNmmALHzZp0Fkz1FMTmGFl1FMEyodIavcCAUHDWrKAIA4aa2oCgILEBupZgHvAhEBcZ6joQBxS76AgccrFlczBvKLC0QI2cBoCFvfTDAo7eoOQInqDPBtvrDEZBNYN5xwNwxQRfw8ZQ5wQVLvO8OYU+mHvFLlDh05Mdg7BT6YrRPpCBznMB2r//xKJjyyOh+cImr2/4doscwD6neZjuZR4AgAABYAAAABy1xcdQtxYBYYZdifkUDgzzXaXn98Z0oi9ILU5mBjFANmRwlVJ3/6jYDAmxaiDG3/6xjQQCCKkRb/6kg/wW+kSJ5//rLobkLSiKmqP/0ikJuDaSaSf/6JiLYLEYnW/+kXg1WRVJL/9EmQ1YZIsv/6Qzwy5qk7/+tEU0nkls3/zIUMPKNX/6yZLf+kFgAfgGyLFAUwY//uQZAUABcd5UiNPVXAAAApAAAAAE0VZQKw9ISAAACgAAAAAVQIygIElVrFkBS+Jhi+EAuu+lKAkYUEIsmEAEoMeDmCETMvfSHTGkF5RWH7kz/ESHWPAq/kcCRhqBtMdokPdM7vil7RG98A2sc7zO6ZvTdM7pmOUAZTnJW+NXxqmd41dqJ6mLTXxrPpnV8avaIf5SvL7pndPvPpndJR9Kuu8fePvuiuhorgWjp7Mf/PRjxcFCPDkW31srioCExivv9lcwKEaHsf/7ow2Fl1T/9RkXgEhYElAoCLFtMArxwivDJJ+bR1HTKJdlEoTELCIqgEwVGSQ+hIm0NbK8WXcTEI0UPoa2NbG4y2K00JEWbZavJXkYaqo9CRHS55FcZTjKEk3NKoCYUnSQ0rWxrZbFKbKIhOKPZe1cJKzZSaQrIyULHDZmV5K4xySsDRKWOruanGtjLJXFEmwaIbDLX0hIPBUQPVFVkQkDoUNfSoDgQGKPekoxeGzA4DUvnn4bxzcZrtJyipKfPNy5w+9lnXwgqsiyHNeSVpemw4bWb9psYeq//uQZBoABQt4yMVxYAIAAAkQoAAAHvYpL5m6AAgAACXDAAAAD59jblTirQe9upFsmZbpMudy7Lz1X1DYsxOOSWpfPqNX2WqktK0DMvuGwlbNj44TleLPQ+Gsfb+GOWOKJoIrWb3cIMeeON6lz2umTqMXV8Mj30yWPpjoSa9ujK8SyeJP5y5mOW1D6hvLepeveEAEDo0mgCRClOEgANv3B9a6fikgUSu/DmAMATrGx7nng5p5iimPNZsfQLYB2sDLIkzRKZOHGAaUyDcpFBSLG9MCQALgAIgQs2YunOszLSAyQYPVC2YdGGeHD2dTdJk1pAHGAWDjnkcLKFymS3RQZTInzySoBwMG0QueC3gMsCEYxUqlrcxK6k1LQQcsmyYeQPdC2YfuGPASCBkcVMQQqpVJshui1tkXQJQV0OXGAZMXSOEEBRirXbVRQW7ugq7IM7rPWSZyDlM3IuNEkxzCOJ0ny2ThNkyRai1b6ev//3dzNGzNb//4uAvHT5sURcZCFcuKLhOFs8mLAAEAt4UWAAIABAAAAAB4qbHo0tIjVkUU//uQZAwABfSFz3ZqQAAAAAngwAAAE1HjMp2qAAAAACZDgAAAD5UkTE1UgZEUExqYynN1qZvqIOREEFmBcJQkwdxiFtw0qEOkGYfRDifBui9MQg4QAHAqWtAWHoCxu1Yf4VfWLPIM2mHDFsbQEVGwyqQoQcwnfHeIkNt9YnkiaS1oizycqJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");  
    snd.play();
    snd.play();
}


function runDetection() {
    model.detect(video).then(predictions => {
        var val = 0;
        if (predictions.length == 0) {
            val = 0
        }
        else if (predictions.length == 1) {
            val = predictions[0]['score']
        }
        else {
            val = Math.max(predictions[0]['score'], predictions[1]['score'])
        }
        running_predictions.push(val)
        running_predictions.shift()
        mean = running_predictions.reduce((a, b) => a + b, 0) / running_predictions.length
        // console.log("Predictions mean: ", running_predictions);
        mean_as_percentage = Math.round(100 * mean / sensitivityThreshold)
        if (mean_as_percentage > 100) { mean_as_percentage = 100; }
        mean_as_percentage = mean_as_percentage.toString();
        // $('#prediction-bar').attr('aria-valuenow', mean_as_percentage)
        $('#prediction-bar').attr('style', "width: " + mean_as_percentage + "%")            

        if (mean > sensitivityThreshold){ // DETECTED!
            $('#user-message').html("Hand detected! Don't touch your face!!!")
            $('.masthead').css('background-image', 'none')
            $('.masthead').css('background-color', '#ff517a')
            setVideoVisibility("visible")
            beep()


            if (isVideo) {
                setTimeout(function(){ requestAnimationFrame(runDetection); }, gapLength * 1000);
                running_predictions.fill(sensitivityThreshold)
            }


        } else {
            $('#user-message').html("Test me! Try touching your face")
            $('.masthead').css('background-image', "url('bg.jpeg')")
            setVideoVisibility(isVideoAlwaysVisible)


            if (isVideo) {
                requestAnimationFrame(runDetection);
            }

        }

        // if (mean < 0.1) {
        //     mean = 0 // to smooth small values to zero
        // }


        // context.clearRect(0, 0, canvas.width, canvas.height);   
        // context.font = "30px Comic Sans MS";
        // context.fillStyle = "red";
        // context.textAlign = "center";

        // if (predictions.length > 0){
        //     context.fillText("Stop touching!", canvas.width/2, canvas.height/2);
        //     beep();
        // // sendNotification({
        // //   title: 'New Notification',
        // //   message: 'Your message goes here',
        // //   icon:'https://cdn2.iconfinder.com/data/icons/mixed-rounded-flat-icon/512/megaphone-64.png',
        // //   clickCallback: function () {
        // //     alert('do something when clicked on notification');
        // //   }
        // // });
        

        // } else {
        //     context.fillText("You're good", canvas.width/2, canvas.height/2);            
        // }
        // model.renderPredictions(predictions, canvas, context, video);


    });
}

function runDetectionImage(img) {
    model.detect(img).then(predictions => {
        model.renderPredictions(predictions, canvas, context, img);
    });
}


var state = 'left'

function transitionRight() {
    if (state == 'left') {
      state = 'right'
      $('#masthead-demo').css('display', 'block')
      $("#masthead-intro").toggle("slide", {direction: "left"}, 500);
      $("#navbar-home-link").removeClass("active")
      $("#navbar-demo-link").addClass("active")

      startVideo();

      setTimeout(function(){
          $("#sticky-footer").css("display", "block");
        }, 5000);
    }
}

function transitionLeft() {
    if (state == 'right') {
      state = 'left'
      $('#masthead-demo').css('display', 'none')
      $("#masthead-intro").toggle("slide", {direction: "right"}, 500);
      $("#navbar-demo-link").removeClass("active")
      $("#navbar-home-link").addClass("active")
      $("#sticky-footer").css("display", "none");

      handTrack.stopVideo(video)
    }
}

function transitionToDownload() {
    window.location.href = "download.html";
}

function transitionToHome() {
    window.location.href = "index.html";
}



if(window.matchMedia("(max-width: 767px)").matches){
    // The viewport is less than 768 pixels wide
    console.log('Mobile device detected. Model load aborted...')
    $('#try-button').html('Try it now >')
    $('#try-button').removeAttr('disabled')
    $('#try-button').removeClass('btn-secondary')
    $('#try-button').addClass('btn-info')  
    $('#try-button').addClass('btn-info')  

      $('#try-button').click(transitionToDownload);              
      $('#demo-link').click(transitionToDownload);
      $('#navbar-home-link').click(transitionToHome)
      $('#navbar-brand').click(transitionToHome)


} else{

    // The viewport is at least 768 pixels wide
    console.log('Loading model...')
      $('#try-button').click(transitionRight);              
      $('#demo-link').click(transitionRight);
      $('#navbar-home-link').click(transitionLeft)
      $('#navbar-brand').click(transitionLeft)

    // Load the model.
    handTrack.load(modelParams).then(lmodel => {
        // detect objects in the image.
        console.log('Model loaded.')
        model = lmodel
        $('#try-button').html('Try it now >')
        $('#try-button').removeAttr('disabled')
        $('#try-button').removeClass('btn-secondary')
        $('#try-button').addClass('btn-info')    
        runDetectionImage(handimg)
        nextImageButton.disabled = false

    });
}


// Webcam list code
var videoSelect = document.querySelector('select#videoSource');
var selectors = [videoSelect];

function gotDevices(deviceInfos) {
  // Handles being called several times to update labels. Preserve values.
  const values = selectors.map(select => select.value);
  selectors.forEach(select => {
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
  });
  console.log(deviceInfos)
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    const option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'audioinput') {
      // option.text = deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
      // audioInputSelect.appendChild(option);
    } else if (deviceInfo.kind === 'audiooutput') {
      // option.text = deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
      // audioOutputSelect.appendChild(option);
    } else if (deviceInfo.kind === 'videoinput') {
      option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
      videoSelect.appendChild(option);
    } else {
      console.log('Some other kind of source/device: ', deviceInfo);
    }
  }
  selectors.forEach((select, selectorIndex) => {
    if (Array.prototype.slice.call(select.childNodes).some(n => n.value === values[selectorIndex])) {
      select.value = values[selectorIndex];
    }
  });
}

function gotStream(stream) {
  window.stream = stream; // make stream available to console
  video.srcObject = stream;
  // Refresh button list in case labels have become available
  return navigator.mediaDevices.enumerateDevices();
}


function changeWebcam() {
  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
  }
  const videoSource = videoSelect.value;
  const constraints = {
    video: {deviceId: videoSource ? {exact: videoSource} : undefined}
  };
  navigator.mediaDevices.getUserMedia(constraints).then(gotStream)
}

// Selector logic

var isVideoAlwaysVisible = "visible";
var gapLength = 3;
var sensitivityThreshold = 0.4;

function setVideoVisibility(visibility) {
    console.log(visibility)
    if (visibility === "hidden") {
        $('#myvideo').css('display', 'none')
    } else if (visibility === "visible") {
        $('#myvideo').css('display', 'inline')       
    } else {
        throw "Invalid value for parameter";
    }
}

videoSelect.onchange = changeWebcam;

$('#videoVisible').change(function() {
    isVideoAlwaysVisible = $(this).val()
    setVideoVisibility(isVideoAlwaysVisible)
});

$('#gapSelect').change(function() {
    gapLength = parseInt($(this).val())
});

$('#sensitivitySelect').change(function() {
    sensitivityThreshold = parseFloat($(this).val())
});
