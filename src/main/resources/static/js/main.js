'use strict';

const disconnectButton = document.querySelector('#logout');
const usernamePage = document.querySelector('#username-page');
const chatPage = document.querySelector('#chat-page');
const usernameForm = document.querySelector('#usernameForm');
const messageForm = document.querySelector('#messageForm');
const messageInput = document.querySelector('#message');
const messageArea = document.querySelector('#messageArea');

let stompClient = null;
let username = null;

const toast = async(type, message, timer= 5000) => {
    await Swal.mixin({
        toast: true,
        position: 'top-end',
        timer: timer,
        showCloseButton: true,
        timerProgressBar: true,
        showConfirmButton: false,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    }).fire({
        timer: timer,
        icon: type,
        html: message,
    });
}

/**
 * Cette fonction renvoie l'heure actuelle au format HH:mm.
 * La fonction commence par créer un nouvel objet Date appelé today.
 * Elle utilise ensuite les méthodes getHours() et getMinutes() pour obtenir l'heure et les minutes actuelles, respectivement.
 * Enfin, elle combine ces valeurs en une chaîne de caractères qu'elle renvoie.
 *
 * @returns {`${number}:${number}`}
 */
const getCurrentTime = () => {
    const today = new Date();
    return `${today.getHours()}:${today.getMinutes()}`;
}

/**
 * Cette fonction prend en entrée un nom d'utilisateur et renvoie une couleur.
 * La fonction commence par créer une valeur de hachage.
 * La valeur de hachage est calculée en multipliant le nom d'utilisateur par 31, puis en ajoutant le code ASCII de chaque caractère du nom d'utilisateur.
 *
 * Une fois la valeur de hachage calculée,
 * la fonction calcule l'indice de la couleur à renvoyer.
 * L'indice est calculé en prenant la valeur absolue de la valeur de hachage et en la divisant par le nombre de couleurs.
 *
 * Enfin, la fonction renvoie la couleur à l'index calculé.
 *
 * @param username
 * @returns {string}
 */
const getAvatarColor = username => {
    let hash = 0;
    const colors = [
        '#2196F3', '#32c787', '#00BCD4', '#ff5652',
        '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
    ];

    for (let i = 0; i < username.length; i++) {
        hash = 31 * hash + username.charCodeAt(i);
    }

    let index = Math.abs(hash % colors.length);
    return colors[index];
}

/**
 * Cette fonction est appelée lorsque l'utilisateur clique sur le bouton "Connexion".
 * La fonction récupère d'abord le nom d'utilisateur à partir des données saisies par l'utilisateur.
 * Si le nom d'utilisateur n'est pas vide, la fonction cache la page du nom d'utilisateur et affiche la page de chat.
 *
 * La fonction crée ensuite un nouvel objet SockJS et un nouvel objet Stomp.
 * L'objet SockJS est utilisé pour se connecter au serveur WebSocket.
 * L'objet Stomp est utilisé pour envoyer et recevoir des messages du serveur WebSocket.
 *
 * La fonction appelle ensuite la méthode connect() sur l'objet Stomp.
 * La méthode connect() prend une charge utile en entrée.
 * La charge utile est un objet qui contient le nom d'utilisateur et d'autres informations.
 *
 * La méthode connect() appelle également deux fonctions : onConnected() et onError().
 * La fonction onConnected() est appelée lorsque la connexion est réussie.
 * La fonction onError() est appelée lorsque la connexion échoue.
 *
 * @param e
 */
const connect = e => {
    username = document.querySelector('#name').value.trim();

    if(username) {
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        const socket = new SockJS('/websocket');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, onConnected, onError);
    }
    e.preventDefault();
}

const disconnect = e => {
    chatPage.classList.add('hidden');
    usernamePage.classList.remove('hidden');
    stompClient.connect({}, onDisconnected, onError)
}

/**
 * La fonction onConnected() masque l'indicateur de chargement et affiche les messages de discussion.
 * @param options
 */
const onConnected = options => {
    // Subscribe to the Public Topic
    stompClient.subscribe('/topic/public', onMessageReceived);
    stompClient.send("/app/chat.register", {}, JSON.stringify({sender: username, type: 'JOIN'}))
}

const onDisconnected = options => {
    stompClient.send("/app/chat.register", {}, JSON.stringify({sender: username, type: 'LEAVE'}))
}

/**
 * La fonction onError() affiche un message d'erreur.
 *
 * @param e
 * @returns {Promise<void>}
 */
const onError = async e => {
    await toast('error', 'Impossible de se connecter à WebSocket ! Rafraîchissez la page et réessayez ou contactez l\'administrateur.');
}

/**
 * Cette fonction est appelée lorsque l'utilisateur clique sur le bouton "Envoyer".
 * La fonction récupère d'abord le contenu du message à partir de l'entrée de l'utilisateur.
 * Si le contenu du message n'est pas vide, la fonction envoie le message au serveur WebSocket.
 *
 * La fonction efface ensuite le champ de saisie du message.
 *
 * @param event
 */
function send(event) {
    let content = messageInput.value.trim();

    if(content && null !== stompClient) {
        stompClient.send("/app/chat.send", {}, JSON.stringify({
            content,
            sender: username,
            type: 'CHAT',
            time: getCurrentTime()
        }));
        messageInput.value = '';
    }
    event.preventDefault();
}

async function onMessageReceived(payload) {
    const message = JSON.parse(payload.body);

    const chatEvent = async (event, type) => {
        await toast(type, event, 2000)
        return `
            <div class="chat-sap">
                <div class="chat-sap-meta"><span>${event}</span></div>
            </div>
        `
    }

    const chatMessage = (message) => `
        <div class="chat ${username === message.sender ? 'is-me' : 'is-you'}">
            <div class="chat-avatar">
                <div class="user-avatar fw-bold" style="background-color: ${getAvatarColor(message.sender)}">
                    <span>${message.sender.charAt(0).toUpperCase()}</span>
                </div>
            </div>
            <div class="chat-content">
                <div class="chat-bubbles">
                    <div class="chat-bubble">
                        <div class="chat-msg">${message.content}</div>
                    </div>
                </div>
                <ul class="chat-meta">
                    <li>${message.sender}</li>
                    <li><time>${message.time}</time></li>
                </ul>
            </div>
        </div>
    `

    switch (message.type) {
        case 'JOIN':
            messageArea.innerHTML += await chatEvent(`${message.sender} a rejoint le chat!`, 'success');
            break;
        case 'LEAVE':
            messageArea.innerHTML += await chatEvent(`${message.sender} a quitté.e chat!`, 'warning');
            break;
        default:
            messageArea.innerHTML += chatMessage(message)
            break;

    }

    messageArea.scrollTop = messageArea.scrollHeight;
}

usernameForm.addEventListener('submit', connect, true)
messageForm.addEventListener('submit', send, true)
disconnectButton.addEventListener('click', disconnect, true)
