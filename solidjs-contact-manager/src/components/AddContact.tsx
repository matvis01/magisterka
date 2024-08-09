import { createSignal, createEffect } from "solid-js";

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
  onDeleteContact?: (id: number) => void; // Optional prop for deleting a contact
  contactToEdit?: Contact; // Optional prop for editing
}

const AddContact = (props: AddContactProps) => {
  const [name, setName] = createSignal("");
  const [surname, setSurname] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [phone, setPhone] = createSignal("");
  const [image, setImage] = createSignal("");

  // Update the form fields when contactToEdit changes
  createEffect(() => {
    if (props.contactToEdit) {
      setName(props.contactToEdit.name);
      setSurname(props.contactToEdit.surname);
      setEmail(props.contactToEdit.email);
      setPhone(props.contactToEdit.phone);
      setImage(props.contactToEdit.image);
    } else {
      // Clear the form if no contact is being edited
      setName("");
      setSurname("");
      setEmail("");
      setPhone("");
      setImage("");
    }
  });

  const handleImageChange = (e: Event) => {
    const target = e.currentTarget as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file); // Convert the image file to a data URL
    }
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const newContact: Contact = {
      id: props.contactToEdit ? props.contactToEdit.id : Date.now(),
      name: name(),
      surname: surname(),
      email: email(),
      phone: phone(),
      image: image(),
    };
    props.onAddContact(newContact);

    // Reset the form after submission
    setName("");
    setSurname("");
    setEmail("");
    setPhone("");
    setImage("");

    (document.getElementById("add_modal") as HTMLDialogElement)?.close();
  };

  const handleDelete = () => {
    if (props.contactToEdit && props.onDeleteContact) {
      props.onDeleteContact(props.contactToEdit.id);
      (document.getElementById("add_modal") as HTMLDialogElement)?.close();
    }
  };

  return (
    <dialog class="modal" id="add_modal">
      <div class="modal-box">
        <form
          onSubmit={handleSubmit}
          class="p-4 card rounded-md grid grid-cols-2 w-full gap-3 items-end"
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
              <span class="label-text">Image (optional)</span>
            </label>
            <input
              type="file"
              id="image"
              onInput={handleImageChange} // Capture the image file
              class="file-input file-input-bordered w-full max-w-xs"
            />
            {image() && (
              <img
                src={image()}
                alt="Contact"
                class="mt-2 w-20 h-20 object-cover rounded-full"
              />
            )}
          </div>
          <div class="form-control mt-6">
            <button type="submit" class="btn btn-primary w-full">
              {props.contactToEdit ? "Save Changes" : "Add Contact"}
            </button>
          </div>
        </form>

        {props.contactToEdit && (
          <div class="mt-4">
            <button
              type="button"
              class="btn btn-error w-full"
              onClick={handleDelete}
            >
              Delete Contact
            </button>
          </div>
        )}
      </div>
      <form method="dialog" class="modal-backdrop">
        <button
          type="button"
          onClick={() =>
            (document.getElementById("add_modal") as HTMLDialogElement)?.close()
          }
        >
          Close
        </button>
      </form>
    </dialog>
  );
};

export default AddContact;
