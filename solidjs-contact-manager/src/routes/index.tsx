import { createSignal } from "solid-js"
import Contact from "../components/Contact"
import testContacts from "../data/testContacts.json"
import AddContact from "~/components/AddContact"

type ContactType = {
  id: number
  name: string
  surname: string
  email: string
  phone: string
  image: string
}

export default function Home() {
  const [searchVal, setSearchVal] = createSignal("")
  const [allContacts, setAllContacts] =
    createSignal<ContactType[]>(testContacts)
  const [contacts, setContacts] = createSignal(allContacts())
  const [contactToEdit, setContactToEdit] = createSignal<
    ContactType | undefined
  >(undefined)

  const addOrUpdateContact = (contact: ContactType) => {
    if (contactToEdit()) {
      // Update existing contact
      setAllContacts(
        allContacts().map((c) => (c.id === contact.id ? contact : c))
      )
    } else {
      // Add new contact
      setAllContacts([...allContacts(), contact])
    }
    filterContacts(searchVal())
    setContactToEdit(undefined) // Reset after adding/updating
  }

  function filterContacts(value: string) {
    setSearchVal(value)
    if (value === "") {
      setContacts(allContacts())
      return
    }
    const allValues = value.split(" ")
    let newListOfContacts = allContacts()
    for (const val of allValues) {
      newListOfContacts = newListOfContacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(val.toLowerCase()) ||
          contact.surname.toLowerCase().includes(val.toLowerCase()) ||
          contact.email.toLowerCase().includes(val.toLowerCase()) ||
          contact.phone.toLowerCase().includes(val.toLowerCase())
      )
    }
    setContacts(newListOfContacts)
  }

  const deleteContact = (id: number) => {
    setAllContacts(allContacts().filter((contact) => contact.id !== id))
    filterContacts(searchVal())
  }

  return (
    <main class="w-full h-full flex justify-center text-base-content ">
      <div class="w-full max-w-screen-xl flex flex-col items-start gap-10 p-10">
        <h1 class="text text-4xl font-bold">Contacts</h1>
        <div class="flex gap-5">
          <input
            class="input input-lg input-primary input-bordered w-full lg:w-1/2 xl:w-96"
            type="text"
            placeholder="Search"
            value={searchVal()}
            onInput={(e) => filterContacts(e.currentTarget.value)}
          />
          <button
            class="btn btn-primary btn-lg"
            onClick={() => {
              setContactToEdit(undefined) // Reset edit mode
              ;(
                document.getElementById("add_modal") as HTMLDialogElement
              )?.showModal()
            }}
          >
            Add Contact
          </button>

          <AddContact
            onAddContact={addOrUpdateContact}
            contactToEdit={contactToEdit()}
            onDeleteContact={deleteContact}
          />
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 w-full justify-items-center items-center">
          {contacts().map((contact) => (
            <Contact
              {...contact}
              edit={() => {
                setContactToEdit(contact)
                ;(
                  document.getElementById("add_modal") as HTMLDialogElement
                )?.showModal()
              }}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
