package tech.devscast.chat.model;

import lombok.Getter;
import lombok.Setter;

public class ChatMessage {
    @Getter
    @Setter
    private String content;

    @Getter
    @Setter
    private String sender;

    @Getter
    @Setter
    MessageType type;

    @Getter
    @Setter
    private String time;

    public enum MessageType {
        CHAT, LEAVE, JOIN
    }
}
