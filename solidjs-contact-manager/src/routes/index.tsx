import { createSignal } from "solid-js";
import Contact from "../components/Contact";
import testContacts from "../data/testContacts.json";

export default function Home() {
  const [searchVal, setSearchVal] = createSignal("");
  const [contacts, setContacts] = createSignal(testContacts);

  function filterContacts(value: string) {
    setSearchVal(value);
    if (value === "") {
      setContacts(testContacts);
      return;
    }
    setContacts(
      testContacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(value.toLowerCase()) ||
          contact.surname.toLowerCase().includes(value.toLowerCase()) ||
          contact.email.toLowerCase().includes(value.toLowerCase()) ||
          contact.phone.toLowerCase().includes(value.toLowerCase())
      )
    );
  }

  return (
    <main class="w-full h-full flex justify-center">
      <div class="w-full max-w-screen-xl flex flex-col items-start gap-10 pt-10">
        <h1 class="text text-4xl font-bold">Contacts</h1>
        <input
          class="input input-lg input-primary input-bordered"
          type="text"
          placeholder="Search"
          value={searchVal()}
          onInput={(e) => filterContacts(e.currentTarget.value)}
        />
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {contacts().map((contact) => (
            <Contact
              name={contact.name}
              surname={contact.surname}
              email={contact.email}
              phone={contact.phone}
              image={contact.image}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
