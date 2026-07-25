{
  "collections": [
    {
      "name": "chats",
      "description": "Stores user chat sessions",
      "fields": {
        "userId": "string (references user uid)",
        "title": "string (auto-generated from first message)",
        "createdAt": "timestamp",
        "updatedAt": "timestamp"
      },
      "subcollections": [
        {
          "name": "messages",
          "description": "Messages within a chat",
          "fields": {
            "role": "string ('user' or 'model')",
            "content": "string",
            "imageBase64": "string (optional, base64 data URI of the uploaded image)",
            "timestamp": "timestamp"
          }
        }
      ]
    }
  ]
}
