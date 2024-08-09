import { createSignal } from "solid-js";
import Contact from "../components/Contact";
import testContacts from "../data/testContacts.json";
import AddContact from "~/components/AddContact";

type ContactType = {
  id: number;
  name: string;
  surname: string;
  email: string;
  phone: string;
  image?: string;
};

export default function Home() {
  const [searchVal, setSearchVal] = createSignal("");
  const [allContacts, setAllContacts] =
    createSignal<ContactType[]>(testContacts);
  const [contacts, setContacts] = createSignal(allContacts());

  const addContact = (contact: ContactType) => {
    setAllContacts([...allContacts(), contact]);
    filterContacts(searchVal());
  };

  function filterContacts(value: string) {
    setSearchVal(value);
    if (value === "") {
      setContacts(allContacts());
      return;
    }
    let allValues = value.split(" ");
    let newListOfContacts = allContacts();
    for (let val of allValues) {
      newListOfContacts = newListOfContacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(val.toLowerCase()) ||
          contact.surname.toLowerCase().includes(val.toLowerCase()) ||
          contact.email.toLowerCase().includes(val.toLowerCase()) ||
          contact.phone.toLowerCase().includes(val.toLowerCase())
      );
    }
    setContacts(newListOfContacts);
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
            onClick={() =>
              (
                document.getElementById("add_modal") as HTMLDialogElement
              )?.showModal()
            }
          >
            add contact
          </button>

          <AddContact onAddContact={addContact} />
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 w-full justify-items-center items-center">
          {contacts().map((contact) => (
            <Contact {...contact} />
          ))}
        </div>
      </div>
    </main>
  );
}
