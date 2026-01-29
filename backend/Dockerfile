FROM golang:1.25

WORKDIR /app

COPY go.work ./
COPY backend/go.mod backend/go.sum ./backend/
COPY shared/go.mod ./shared/

RUN cd backend && go mod download

EXPOSE 8080

CMD ["go", "run", "./backend/cmd/server"]
