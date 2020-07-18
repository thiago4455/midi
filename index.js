let device = null;
let keys = []
let audios = []
let trails = []

window.onload = () => {
    for (let wK of document.getElementById('pianoRoll').children){
        keys.push(wK);
        audios.push(new Audio(`notes/${wK.id.replace('#','%23')}.mp3`))
        wK.onmousedown = (e) => onMidiMessage({data:[144,21+keys.indexOf(e.target),127]})
        wK.onmouseup = (e) => onMidiMessage({data:[128,21+keys.indexOf(e.target),127]})
        if(wK.children.length > 0){
            keys.push(wK.children[0])
            audios.push(new Audio(`notes/${wK.children[0].id.replace('#','%23')}.mp3`))
            wK.children[0].onmousedown = (e) => {onMidiMessage({data:[144,21+keys.indexOf(e.target),127]}); e.stopPropagation()}
            wK.children[0].onmouseup = (e) => {onMidiMessage({data:[128,21+keys.indexOf(e.target),127]});e.stopPropagation()}
        }
    }


    function loop(timestamp) {
        var progress = timestamp - lastRender
        update(progress)
        lastRender = timestamp
        window.requestAnimationFrame(loop)
    }
    var lastRender = 0
    window.requestAnimationFrame(loop)
}

function update(progress){
    progress /= 1.5
    trails.forEach(t => {
        if(t.keydown){
            t.height += parseInt(progress)
            t.node.style.height = `${t.height}px`
        }
        else{
            t.postion += parseInt(progress)
            t.node.style.bottom = `${t.postion}px` 
        }
    })
}


function onMidiMessage(m){
    switch (m.data[0]) {
        // Keydown
        case 144:
            keys[m.data[1]-21].classList.add('playing');
            keys[m.data[1]-21].style.setProperty("--bgc", `rgba(0,0,255,${m.data[2]/127})`);
            audios[m.data[1]-21].currentTime = 0;
            audios[m.data[1]-21].volume = m.data[2]/127;
            audios[m.data[1]-21].play()
            let trail = {
                height: 1,
                postion: keys[m.data[1]-21].clientHeight,
                node: document.createElement("div"),
                keydown: true,
                keyId: m.data[1]-21
            }
            trail.node.classList.add('trail');
            trail.node.style.bottom = `${trail.postion}px`
            trail.node.style.height = `${trail.height}px`
            keys[m.data[1]-21].appendChild(trail.node);
            trails.push(trail);
            break;

        // Keyup
        case 128:
            keys[m.data[1]-21].classList.remove('playing');
            audios[m.data[1]-21].pause()
            for (let i = trails.length; i--;) {
                if(trails[i].keyId===m.data[1]-21){
                    trails[i].keydown = false
                    break
                }
            }
            break;
    
        default:
            break;
    }
}

navigator.requestMIDIAccess().then(access => {
    access.inputs.forEach((d,key) => {
        let div = document.createElement("div");
        div.appendChild(document.createTextNode(d.name));
        document.getElementById('devicesList').appendChild(div)
        div.onclick = () => {
            document.getElementById('devicesList').classList.add('hidden');
            d.onmidimessage = onMidiMessage;
            device = d;
        }
    })
})