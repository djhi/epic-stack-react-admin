<div align="center">
  <h1 align="center"><a href="https://www.epicweb.dev/epic-stack">The Epic Stack 🚀</a></h1>
  <strong align="center">
    Ditch analysis paralysis and start shipping Epic Web apps.
  </strong>
  <p>
    This is an opinionated project starter and reference that allows teams to
    ship their ideas to production faster and on a more stable foundation based
    on the experience of <a href="https://kentcdodds.com">Kent C. Dodds</a> and
    <a href="https://github.com/epicweb-dev/epic-stack/graphs/contributors">contributors</a>.
  </p>
</div>

## Differences With Default Epic Stack

- Added react-admin dependencies
- Add 2 routes under the `app/routes/admim+` directory
  - `$.tsx`: the react-admin frontend
  - `api.$.tsx`: the react-admin API

## Description

The `api.$.tsx` contains a `loader` and an `action` that translate react-admin queries to Prisma.
