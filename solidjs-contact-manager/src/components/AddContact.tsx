import { createSignal } from "solid-js";

interface Contact {
  id: number;
  name: string;
  surname: string;
  email: string;
  phone: string;
  image: string;
}

interface AddContactProps {
  onAddContact: (contact: Contact) => void;
}

const AddContact = (props: AddContactProps) => {
  const [name, setName] = createSignal("");
  const [surname, setSurname] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [phone, setPhone] = createSignal("");
  const [image, setImage] = createSignal("");

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const newContact: Contact = {
      id: Date.now(),
      name: name(),
      surname: surname(),
      email: email(),
      phone: phone(),
      image:
        image() ||
        `https://randomuser.me/api/portraits/men/${Math.floor(
          Math.random() * 100
        )}.jpg`,
    };
    props.onAddContact(newContact);
    setName("");
    setSurname("");
    setEmail("");
    setPhone("");
    setImage("");

    (document.getElementById("add_modal") as HTMLDialogElement)?.close();
  };

  return (
    <dialog class="modal" id="add_modal">
      <div class="modal-box">
        <form
          onSubmit={handleSubmit}
          class=" p-4  card rounded-md grid grid-cols-2 w-full gap-3 items-end"
        >
          <div class="form-control">
            <label class="label" for="name">
              <span class="label-text">Name</span>
            </label>
            <input
              type="text"
              id="name"
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
              class="input input-bordered w-full"
              required
            />
          </div>
          <div class="form-control">
            <label class="label" for="surname">
              <span class="label-text">Surname</span>
            </label>
            <input
              type="text"
              id="surname"
              value={surname()}
              onInput={(e) => setSurname(e.currentTarget.value)}
              class="input input-bordered w-full"
              required
            />
          </div>
          <div class="form-control">
            <label class="label" for="email">
              <span class="label-text">Email</span>
            </label>
            <input
              type="email"
              id="email"
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
              class="input input-bordered w-full"
              required
            />
          </div>
          <div class="form-control">
            <label class="label" for="phone">
              <span class="label-text">Phone</span>
            </label>
            <input
              type="tel"
              id="phone"
              value={phone()}
              onInput={(e) => setPhone(e.currentTarget.value)}
              class="input input-bordered w-full"
              required
            />
          </div>
          <div class="form-control">
            <label class="label" for="image">
              <span class="label-text">Image URL (optional)</span>
            </label>
            <input
              type="text"
              id="image"
              value={image()}
              onInput={(e) => setImage(e.currentTarget.value)}
              class="input input-bordered w-full"
            />
          </div>
          <div class="form-control mt-6">
            <button type="submit" class="btn btn-primary w-full">
              Add Contact
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
};

export default AddContact;
