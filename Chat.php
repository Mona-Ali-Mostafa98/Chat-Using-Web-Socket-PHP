<?php

require __DIR__ . '/vendor/autoload.php';

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

class Chat implements MessageComponentInterface
{
    protected $clients;
    protected $usernames;

    public function __construct()
    {
        $this->clients = new \SplObjectStorage;
        $this->usernames = [];
    }

    public function onOpen(ConnectionInterface $conn)
    {
        // Store the new connection
        $this->clients->attach($conn);
        echo "New connection! ({$conn->resourceId})\n";
    }

    public function onMessage(ConnectionInterface $from, $msg)
    {
        $data = json_decode($msg, true);

        if (isset($data['login']) && isset($data['username'])) {
            $this->handleLogin($from, $data['username']);
        } elseif (isset($data['body'])) {
            $this->handleChatMessage($from, $data['body']);
        }
    }

    public function onClose(ConnectionInterface $conn)
    {
        $this->clients->detach($conn);

        $username = $this->usernames[$conn->resourceId] ?? 'Unknown';
        unset($this->usernames[$conn->resourceId]);

        $message = [
            'type' => 'logout',
            'message' => "$username has disconnected",
            'online' => $this->getOnlineUsers()
        ];

        $this->sendToAllClients(json_encode($message));
        echo "Connection {$conn->resourceId} has disconnected\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e)
    {
        echo "An error has occurred: {$e->getMessage()}\n";
        $conn->close();
    }

    protected function getOnlineUsers()
    {
        return array_values($this->usernames);
    }

    protected function sendToAllClients($message, $exclude = null)
    {
        foreach ($this->clients as $client) {
            if ($client !== $exclude) {
                $client->send($message);
            }
        }
    }

    private function handleLogin(ConnectionInterface $from, $username)
    {
        $this->usernames[$from->resourceId] = $username;

        $message = [
            'username' => $username,
            'message' => "$username has joined",
            'type' => 'login',
            'online' => $this->getOnlineUsers()
        ];

        $this->sendToAllClients(json_encode($message), $from);
    }

    private function handleChatMessage(ConnectionInterface $from, $body)
    {
        $message = [
            'message' => $body,
            'type' => 'chat',
            'online' => $this->getOnlineUsers()
        ];

        $this->sendToAllClients(json_encode($message), $from);
    }
}

$server = \Ratchet\Server\IoServer::factory(
    new \Ratchet\Http\HttpServer(
        new \Ratchet\WebSocket\WsServer(
            new Chat()
        )
    ),
    8090
);

echo "---server started\n";
$server->run();
