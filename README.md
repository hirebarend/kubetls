# KubeTLS

## Installation

### Prerequisites

* Install `kubectl`
* Install `helm`

### Clone Repository

```bash
git clone https://github.com/hirebarend/kubetls.git

cd kubetls
```

### Configure `helm-charts/values.yaml`

```bash
nano helm-charts/values.yaml
```

* `HOST` 
* `MONGODB_CONNECTION_STRING`
* `MONGODB_DATABASE_NAME`

### Install `kubetls` using `helm`

```bash
helm install kubetls ./helm-charts
```

## Usage

### Create Order

```bash
curl -X 'POST' 'https://kubetls.example.com/api/v1/orders' -H 'accept: application/json' -H 'Content-Type: application/json' -d '{ "fqdn": "example.com" }'
```

## Contributing

We love our contributors! Here's how you can contribute:

- [Open an issue](https://github.com/hirebarend/kubetls/issues) if you believe you've encountered a bug.
- Make a [pull request](https://github.com/hirebarend/kubetls/pull) to add new features/make quality-of-life improvements/fix bugs.