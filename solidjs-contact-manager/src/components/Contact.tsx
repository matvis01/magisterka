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
  const { name, surname, email, phone, image } = props
  return (
    <div class="card h-full flex card-compact bg-neutral w-full shadow-xl text-neutral-content">
      <div class="card-body">
        <div class="flex items-center gap-5">
          <img
            src={
              image ||
              `https://eu.ui-avatars.com/api/?name=${name}+${surname}&size=250`
            }
            alt="contact"
            class="rounded-full w-16 h-16"
          />
          <div class="flex-grow">
            <h2 class="text-lg font-bold flex items-center gap-2">
              {name} {surname}
            </h2>
            <p class="text-sm">{email}</p>
            <p class="text-sm">{phone}</p>
            {props.notes && <p class="text-xs mt-1 italic">{props.notes}</p>}
            {props.tags && props.tags.length > 0 && (
              <div class="flex flex-wrap gap-1 mt-1">
                {props.tags.map(tag => (
                  <span class="badge badge-outline badge-sm">{tag}</span>
                ))}
              </div>
            )}
          </div>
          <div class="flex flex-col gap-1 ml-auto">
            <button onClick={props.edit} class="btn btn-ghost btn-sm">
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
