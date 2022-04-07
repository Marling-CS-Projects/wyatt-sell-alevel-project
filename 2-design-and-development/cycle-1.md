# 2.2.1 Cycle 1

## Design

### Objectives

In this cycle, I aim to setup and configure my project, in the form of a monorepo. A monorepo is a codebase structure where the code for multiple elements of a project are stored in the same repository. I chose to use a monorepo configuration, as it allows for sharing of types and schemas between the client and the server. This would ensure two way validation of requests, and ensuring continuity between all modules within my project.

* [x] Configure a \`yarn\` monorepo with a [Socket.IO](https://socket.io) server and a [Next.js](https://nextjs.org) (with API authentication routes) client configured
* [x] Create a shared "package" which can be imported and used in both the server and the client
* [x] Install and setup [Prisma](https://www.prisma.io) to allow for interaction with a database within Typescript.
* [x] Configure a build flow, using [TSC](https://www.typescriptlang.org), [Preconstruct](https://preconstruct.tools), [Prisma deployments](https://www.prisma.io/docs/reference/api-reference/command-reference#migrate-deploy) and [Heroku Procfiles](https://devcenter.heroku.com/articles/procfile)
* [x] Created a docker-compose file that contains [PostgreSQL](https://www.postgresql.org) and [Redis](https://redis.io) Docker containers

### Usability Features

### Key Variables

| Variable Name | Use                                                                                    |
| ------------- | -------------------------------------------------------------------------------------- |
| redis         | Initialises a connection to Redis                                                      |
| env           | An object which contains validated environment variables (i.e. PORT, REDIS\_URL, etc.) |
| server        | The base http web server that allows a Socket.io websocket to mount on it              |
| socket        | Initialises a websocket server                                                         |

### Pseudocode

```
procedure start_server
    connect_to_prisma()
    connect_to_redis()
    server_listen(port)
end start_server

procedure socket_on_connect
    // Implement authentication and message flows
end socket_on_connect
```

## Development

### Outcome

### Challenges

Description of challenges

## Testing

Evidence for testing

### Tests

| Test | Instructions  | What I expect     | What actually happens | Pass/Fail |
| ---- | ------------- | ----------------- | --------------------- | --------- |
| 1    | Run code      | Thing happens     | As expected           | Pass      |
| 2    | Press buttons | Something happens | As expected           | Pass      |

### Evidence

![](<../.gitbook/assets/image (1).png>)
