import React, { useState, useEffect } from "react";
import styles from "./WAForm.module.css";


interface Message {
    id: string;
    text: string;
    sender: "user" | "recipient";
    senderName?: string;
}

const WAForm: React.FC = () => {
    const [idInstance, setIdInstance] = useState("");
    const [apiTokenInstance, setApiTokenInstance] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [message, setMessage] = useState("");
    const [chat, setChat] = useState<Message[]>([]);
    const [userAvatar, setUserAvatar] = useState<string>("");

    const sendMessage = async () => {
        if (!idInstance || !apiTokenInstance || !phoneNumber || !message) {
            alert("Введите все данные!");
            return;
        }

        const url = `https://api.green-api.com/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;
        const payload = {
            chatId: `${phoneNumber}@c.us`,
            message,
        };
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (response.ok) {
                setChat([...chat, { id: Date.now().toString(), text: message, sender: "user" }]);
                setMessage("");
            }
        } catch (error) {
            console.error("Ошибка при отправке сообщения", error);
        }
    };

    const receiveMessages = async () => {
        if (!idInstance || !apiTokenInstance) return;

        const url = `https://api.green-api.com/waInstance${idInstance}/receiveNotification/${apiTokenInstance}`;
        try {
            const response = await fetch(url);

            if (!response.ok) {
                console.error(`Ошибка сервера ${response.status}: ${response.statusText}`);
                return;
            }

            const data = await response.json();

            if (!data) {
                console.log("Нет новых сообщений (data === null)");
                return;
            }

            if (!data.body) {
                console.warn("Ответ API не содержит body:", data);
                return;
            }

            console.log("Полученные данные:", data);

            const { typeWebhook, idMessage, senderData, messageData } = data.body;

            if (typeWebhook === "incomingMessageReceived" && messageData?.textMessageData?.textMessage) {
                setChat((prevChat) => [
                    ...prevChat,
                    {
                        id: idMessage,
                        text: messageData.textMessageData.textMessage,
                        sender: "recipient" as const,
                        senderName: senderData.senderName || "Неизвестный",
                    },
                ]);
                console.log("Обновленный чат:", chat);
            }

            if (data.receiptId) {
                await fetch(
                    `https://api.green-api.com/waInstance${idInstance}/deleteNotification/${apiTokenInstance}/${data.receiptId}`,
                    { method: "DELETE" }
                );
            }
        } catch (error) {
            console.error("Ошибка при получении сообщений:", error);
        }
    };
    useEffect(() => {
        const fetchWaSettings = async () => {
            if (!idInstance || !apiTokenInstance) {
                setUserAvatar("");
                return;
            }
            const url = `https://api.green-api.com/waInstance${idInstance}/getWaSettings/${apiTokenInstance}`;
            try {
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    if (data.avatar) {
                        setUserAvatar(data.avatar);
                    } else {
                        setUserAvatar("");
                    }
                } else {
                    setUserAvatar("");
                }
            } catch (error) {
                console.error("Ошибка получения настроек аккаунта", error);
                setUserAvatar("");
            }
        };
        fetchWaSettings();
    }, [idInstance, apiTokenInstance]);
    useEffect(() => {
        const interval = setInterval(receiveMessages, 5000);
        return () => clearInterval(interval);
    }, [idInstance, apiTokenInstance, phoneNumber]);


    return (
        <div style={{ padding: "20px" }}>
            <h2 className={styles['headText']}>WhatsApp Chat</h2>
            <div>
                <img
                    className={styles.imageUser}
                    src={userAvatar ? userAvatar : './defaultUser.png'}
                    alt="user avatar"
                />
            </div>
            <input className={styles['inputText']} type="text" placeholder="idInstance" value={idInstance} onChange={(e) => setIdInstance(e.target.value)} />
            <input className={styles['inputText']} type="text" placeholder="apiTokenInstance" value={apiTokenInstance} onChange={(e) => setApiTokenInstance(e.target.value)} />
            <input className={styles['inputText']} type="text" placeholder="Номер получателя" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
            <textarea className={styles['inputTextArea']} placeholder="Введите сообщение" value={message} onChange={(e) => setMessage(e.target.value)} />
            <button className={styles['ButtnSubm']} onClick={sendMessage}>Отправить</button>
            <div className={styles.chatContainer}>
                {chat.map((msg) => (
                    <div
                        key={msg.id}
                        className={`${styles.chatText} ${msg.sender === "user" ? styles.userMessage : styles.recipientMessage}`}
                    >
                        <strong>{msg.sender === "user" ? "Вы" : msg.senderName}:</strong> {msg.text}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WAForm;
