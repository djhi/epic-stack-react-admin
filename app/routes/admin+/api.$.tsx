import {
	json,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import { matchPath } from '@remix-run/react'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithRole } from '#app/utils/permissions.ts'

// Define the fields used for full-text search on each model
const searchFields = {
	user: ['email', 'username', 'name'],
	note: ['title', 'content'],
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
	await requireUserWithRole(request, 'admin')

	const url = new URL(request.url)
	const matchModel = matchPath('/admin/api/:model/*', url.pathname)
	const matchRecord = matchPath('/admin/api/:model/:id/*', url.pathname)

	// Check that the model exists in Prisma
	if (
		!matchModel ||
		matchModel.params.model == null ||
		!Object.hasOwn(prisma, matchModel.params.model)
	) {
		return new Response('Not found', { status: 404 })
	}

	if (!matchRecord) {
		return handleGetList(request, matchModel.params.model)
	}

	if (matchRecord.params.id == null) {
		return new Response('Not found', { status: 404 })
	}

	return handleGetOne(request, matchModel.params.model, matchRecord.params.id)
}

export const action = async ({ request }: ActionFunctionArgs) => {
	await requireUserWithRole(request, 'admin')

	switch (request.method) {
		case 'POST':
			return handleCreate(request)
		case 'PUT':
			return handleUpdate(request)
		case 'DELETE':
			return handleDelete(request)
		default:
			return new Response('Not found', { status: 404 })
	}
}

const handleGetList = async (request: Request, model: string) => {
	const url = new URL(request.url)
	const params = new URLSearchParams(url.search)
	const { skip, take } = getRange(params.get('range'))
	const { sortField, order } = getSort(params.get('sort'))
	const filters = getFilters(model, params.get('filter'))
	const queryParams = {
		skip,
		take: take,
		orderBy: {
			[sortField]: order,
		},
	}

	if (filters) {
		// @ts-ignore
		queryParams['where'] = filters
	}

	// @ts-ignore
	const data = await prisma[model].findMany(queryParams)
	// @ts-ignore
	const total = await prisma[model].count({
		where: filters,
	})
	return new Response(JSON.stringify(data), {
		headers: {
			'Content-Type': 'application/json',
			'Content-Range': `${skip}-${skip + take}/${total}`,
		},
	})
}

const handleGetOne = async (request: Request, model: string, id: string) => {
	// @ts-ignore
	const data = await prisma[model].findUnique({
		where: {
			id,
		},
	})

	return json(data)
}

const handleCreate = async (request: Request) => {
	const url = new URL(request.url)
	const matchModel = matchPath('/admin/api/:model/*', url.pathname)

	// Check that the model exists in Prisma
	if (
		!matchModel ||
		matchModel.params.model == null ||
		!Object.hasOwn(prisma, matchModel.params.model)
	) {
		return new Response('Not found', { status: 404 })
	}

	const body = await request.json()

	// @ts-ignore
	const data = await prisma[matchModel.params.model].create({
		data: body,
	})
	return json(data)
}

const handleUpdate = async (request: Request) => {
	const url = new URL(request.url)
	const matchRecord = matchPath('/admin/api/:model/:id/*', url.pathname)

	// Check that the model exists in Prisma
	if (
		!matchRecord ||
		matchRecord.params.model == null ||
		!Object.hasOwn(prisma, matchRecord.params.model)
	) {
		return new Response('Not found', { status: 404 })
	}
	const body = await request.json()
	const { id, ...rest } = body as any

	if (matchRecord.params.id != id) {
		return new Response('Not found', { status: 404 })
	}
	// @ts-ignore
	const data = await prisma[matchRecord.params.model].update({
		data: rest,
		where: {
			id,
		},
	})
	return json(data)
}

const handleDelete = async (request: Request) => {
	const url = new URL(request.url)
	const matchRecord = matchPath('/admin/api/:model/:id/*', url.pathname)

	// Check that the model exists in Prisma
	if (
		!matchRecord ||
		matchRecord.params.model == null ||
		!Object.hasOwn(prisma, matchRecord.params.model)
	) {
		return new Response('Not found', { status: 404 })
	}

	// @ts-ignore
	const data = await prisma[matchRecord.params.model].delete({
		where: {
			id: matchRecord.params.id,
		},
	})
	return json(data)
}

const getRange = (range: string | null) => {
	let skip = 0
	let take = 10

	if (!range) return { skip, take }

	try {
		const parsedRange = JSON.parse(decodeURIComponent(range)) as [
			number,
			number,
		]
		skip = parsedRange[0]
		take = parsedRange[1]
	} catch (e) {}

	return { skip, take }
}

const getSort = (sort: string | null) => {
	let sortField = 'id'
	let order = 'desc'

	if (!sort) return { sortField, order }

	try {
		const parsedRange = JSON.parse(decodeURIComponent(sort)) as [string, string]
		sortField = parsedRange[0]
		order = parsedRange[1].toLowerCase()
	} catch (e) {}

	return { sortField, order }
}

const getFilters = (model: string, filter: string | null) => {
	if (!filter) return undefined

	try {
		const parsedFilter = JSON.parse(decodeURIComponent(filter)) as any

		if (Object.keys(parsedFilter).length === 0) {
			return undefined
		}

		return Object.keys(parsedFilter).reduce(
			(acc, key) => {
				if (Array.isArray(parsedFilter[key])) {
					acc.AND.push({
						[key]: {
							in: parsedFilter[key],
						},
					})
					return acc
				}
				if (key === 'q') {
					acc['OR'] = [
						...searchFields.user.map(field => ({
							[field]: {
								contains: parsedFilter[key],
							},
						})),
					]
					return acc
				}
				acc.AND.push({
					[key]: {
						equals: parsedFilter[key],
					},
				})
				return acc
			},
			{
				AND: [] as any[],
			} as any,
		)
	} catch (e) {}

	return {}
}
