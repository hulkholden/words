Word Solver
==============

A web app to solve simple words games.

## Local Testing

Natively:

```bash
bazel run :words -- --port=9090
```

With docker:

```bash
bazel build //:words_tarball
docker load --input $(bazel cquery --output=files //:words_tarball)
docker run --rm -p 9090:80 words:latest
```

## Credits

The profanity list was derived from https://github.com/surge-ai/profanity and
the frequency list was derived from https://www.kaggle.com/datasets/rtatman/english-word-frequency.