import { type LoaderFunctionArgs } from '@remix-run/node'
import simpleRestProvider from 'ra-data-simple-rest'
import { lazy } from 'react'
import {
	Admin,
	Resource,
	List,
	Datagrid,
	TextField,
	EmailField,
	DateField,
	ReferenceField,
	Edit,
	SimpleForm,
	TextInput,
	ReferenceInput,
	SearchInput,
} from 'react-admin'
import { requireUserWithRole } from '#app/utils/permissions.ts'
import styles from '../../styles/admin.css'

export function links() {
	return [{ rel: 'stylesheet', href: styles }]
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
	await requireUserWithRole(request, 'admin')
	return null
}

export default function App() {
	return (
		<Admin
			basename="/admin"
			// @ts-ignore For some reason, the default export is inferred as `default`
			dataProvider={simpleRestProvider('/admin/api')}
		>
			<Resource
				name="user"
				list={UserList}
				edit={UserEdit}
				recordRepresentation="name"
			/>
			<Resource
				name="note"
				list={NoteList}
				edit={NoteEdit}
				recordRepresentation={<NoteRepresentation />}
			/>
		</Admin>
	)
}

const UserList = () => (
	<List filters={[<SearchInput source="q" key="q" alwaysOn />]}>
		<Datagrid rowClick="edit">
			<TextField source="id" />
			<EmailField source="email" />
			<TextField source="username" />
			<TextField source="name" />
			<DateField source="createdAt" />
			<DateField source="updatedAt" />
		</Datagrid>
	</List>
)

const UserEdit = () => (
	<Edit>
		<SimpleForm>
			<TextInput source="email" />
			<TextInput source="username" />
			<TextInput source="name" />
		</SimpleForm>
	</Edit>
)

const NoteList = () => (
	<List
		filters={[
			<SearchInput source="q" key="q" alwaysOn />,
			<ReferenceInput
				source="ownerId"
				key="ownerId"
				reference="user"
				alwaysOn
			/>,
		]}
	>
		<Datagrid rowClick="edit">
			<TextField source="id" />
			<TextField source="title" />
			<DateField source="createdAt" />
			<DateField source="updatedAt" />
			<ReferenceField source="ownerId" reference="user" />
		</Datagrid>
	</List>
)

const RichTextInput = lazy(() =>
	import('ra-input-rich-text').then(module => ({
		default: module.RichTextInput,
	})),
)

const NoteRepresentation = () => (
	<>
		<TextField source="title" variant="h6" />
		&nbsp;&#40;
		<ReferenceField source="ownerId" reference="user" link={false}>
			<TextField source="name" variant="h6" />
		</ReferenceField>
		&#41;
	</>
)

const NoteEdit = () => (
	<Edit title={<NoteRepresentation />}>
		<SimpleForm>
			<TextInput source="title" fullWidth />
			<RichTextInput source="content" />
			<ReferenceInput source="ownerId" reference="user" />
		</SimpleForm>
	</Edit>
)
