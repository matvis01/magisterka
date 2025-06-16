type ContactProps = {
  id: number
  name: string
  surname: string
  email: string
  phone: string
  image?: string
  notes?: string
  tags?: string[]
  favorite?: boolean
  edit: () => void
  children?: any
}

export default function Contact(props: ContactProps) {
  const { name, surname, email, phone, image, tags } = props
  return (
    <div class="bg-white rounded-lg shadow-md border border-gray-200 h-full flex flex-col w-full">
      <div class="p-4 flex-1">
        <div class="flex items-center gap-3">
          <img
            src={
              image ||
              `https://eu.ui-avatars.com/api/?name=${name}+${surname}&size=250`
            }
            alt="contact"
            class="rounded-full w-16 h-16 object-cover"
          />
          <div class=" flex flex-col gap-1 w-full">
            <h2 class="text-lg font-bold flex items-center gap-2 text-gray-900">
              {name} {surname}
            </h2>
            <p class="text-sm text-gray-600">{email}</p>
            <p class="text-sm text-gray-600">{phone}</p>
            {props.notes && <p class="text-xs mt-1 italic text-gray-500">{props.notes}</p>}
            {tags && tags.length > 0 && (
              <div class="flex flex-wrap gap-1 mt-1">
                {tags.map(tag => (
                  <span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full border border-blue-200">{tag}</span>
                ))}
              </div>
            )}
          </div>
          <div class="flex flex-col gap-1 ml-auto">
            <button onClick={props.edit} class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <FiEdit2 />
            </button>
            {props.children}
          </div>
        </div>
      </div>
    </div>
  )
}

function FiEdit2() {
  return (
    <svg
      fill="none"
      stroke-width="2"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      viewBox="0 0 24 24"
      height="1em"
      width="1em"
      style="overflow: visible; color: currentcolor;"
    >
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </svg>
  )
}
