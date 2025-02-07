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
            const data = await response.json();
            console.log("Полученные данные:", data);

            if (data || data.body) {
                const { typeWebhook, idMessage, senderData, messageData } = data.body;
                if (
                    typeWebhook === "incomingMessageReceived" ||
                    messageData.textMessageData?.textMessage
                ) {

                    setChat((prevChat) => {
                        const updatedChat = [
                            ...prevChat,
                            {
                                id: idMessage,
                                text: messageData.textMessageData.textMessage,
                                sender: "recipient" as const,
                                senderName: senderData.senderName || "Неизвестный",
                            },
                        ];
                        console.log("Обновленный чат:", updatedChat);
                        return updatedChat;
                    });
                }
                await fetch(
                    `https://api.green-api.com/waInstance${idInstance}/deleteNotification/${apiTokenInstance}/${data.receiptId}`,
                    { method: "DELETE" }
                );
            }
        } catch (error) {
            console.error("Ошибка при получении сообщений", error);
        }
    };




    useEffect(() => {
        const interval = setInterval(receiveMessages, 10000);
        return () => clearInterval(interval);
    }, [idInstance, apiTokenInstance, phoneNumber]);


    return (
        <div style={{ padding: "20px" }}>
            <h2 className={styles['headText']}>WhatsApp Chat</h2>
            <div>
                <img className={styles['imageUser']} src='./defaultUser.png' alt="default user" />
            </div>
            <input className={styles['inputText']} type="text" placeholder="idInstance" value={idInstance} onChange={(e) => setIdInstance(e.target.value)} />
            <input className={styles['inputText']} type="text" placeholder="apiTokenInstance" value={apiTokenInstance} onChange={(e) => setApiTokenInstance(e.target.value)} />
            <input className={styles['inputText']} type="text" placeholder="Номер получателя" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
            <textarea className={styles['inputTextArea']} placeholder="Введите сообщение" value={message} onChange={(e) => setMessage(e.target.value)} />
            <button className={styles['ButtnSubm']} onClick={sendMessage}>Отправить</button>
            <div style={{ marginTop: "20px", minHeight: "100px", border: "1px solid black", padding: "10px", background: 'white' }}>
                <h3 className={styles['headChatText']}>Чат</h3>
                {chat.map((msg) => {
                    console.log("Состояние чата перед рендером:", chat);
                    console.log("Рендерим сообщение:", msg);
                    return (
                        <div
                            key={msg.id}
                            className={styles['chatText']}>
                            <strong>{msg.sender === "user" ? "Вы" : msg.senderName}:</strong> {msg.text}
                        </div>
                    );
                })}

            </div>
        </div>
    );
};

export default WAForm;
