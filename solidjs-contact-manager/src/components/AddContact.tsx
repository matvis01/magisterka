import { createSignal, createEffect, createResource } from "solid-js"

function validateEmail(email: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
}

function validatePhone(phone: string) {
  return /^\+?\d{7,15}$/.test(phone.replace(/\s/g, ''))
}

const [countryCodes] = createResource(async () => {
  const response = await fetch('/data/CountryCodes.json')
  return response.json()
})

interface Contact {
  id: number
  name: string
  surname: string
  email: string
  phone: string
  image: string
  notes?: string
  tags?: string[]
  favourite?: boolean
}

interface AddContactProps {
  onAddContact: (contact: Contact) => void
  onDeleteContact?: (id: number) => void
  contactToEdit?: Contact
}

const AddContact = (props: AddContactProps) => {
  const [name, setName] = createSignal("")
  const [surname, setSurname] = createSignal("")
  const [email, setEmail] = createSignal("")
  const [emailError, setEmailError] = createSignal("")
  const [phone, setPhone] = createSignal("")
  const [countryCode, setCountryCode] = createSignal("+1")
  const [phoneError, setPhoneError] = createSignal("")
  const [image, setImage] = createSignal("")
  const [notes, setNotes] = createSignal("")
  const [tags, setTags] = createSignal("")
  const [favourite, setFavourite] = createSignal(false)

  createEffect(() => {
    if (props.contactToEdit) {
      setName(props.contactToEdit.name)
      setSurname(props.contactToEdit.surname)
      setEmail(props.contactToEdit.email)
      
      const phoneNumber = props.contactToEdit.phone;
      const countryCodeMatch = phoneNumber.match(/^\+\d+/);
      if (countryCodeMatch && countryCodes()?.some((c:any) => c.dial_code === countryCodeMatch[0])) {
        setCountryCode(countryCodeMatch[0]);
        setPhone(phoneNumber.substring(countryCodeMatch[0].length).trim());
      } else {
        setCountryCode("+1");
        setPhone(phoneNumber);
      }
      
      setImage(props.contactToEdit.image)
      setNotes(props.contactToEdit.notes || "")
      setTags((props.contactToEdit.tags || []).join(", "))
      setFavourite(!!props.contactToEdit.favourite)
    } else {
      setName("")
      setSurname("")
      setEmail("")
      setCountryCode("+1")
      setPhone("")
      setImage("")
      setNotes("")
      setTags("")
      setFavourite(false)
    }
  })

  const handleImageChange = (e: Event) => {
    const target = e.currentTarget as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEmailChange = (e: Event) => {
    const value = (e.target as HTMLInputElement).value
    setEmail(value)
    if (value && !validateEmail(value)) {
      setEmailError("Please enter a valid email address")
    } else {
      setEmailError("")
    }
  }

  const handlePhoneChange = (e: Event) => {
    const value = (e.target as HTMLInputElement).value
    setPhone(value)
    if (value && !validatePhone(value)) {
      setPhoneError("Please enter a valid phone number")
    } else {
      setPhoneError("")
    }
  }

  const handleSubmit = (e: Event) => {
    e.preventDefault()

    const emailValid = validateEmail(email())
    const phoneValid = validatePhone(phone())

    setEmailError(emailValid ? "" : "Please enter a valid email address")
    setPhoneError(phoneValid ? "" : "Please enter a valid phone number")

    if (!emailValid || !phoneValid) {
      return
    }

    const fullPhoneNumber = `${countryCode()}${phone().startsWith(' ') ? '' : ' '}${phone()}`

    const newContact: Contact = {
      id: props.contactToEdit ? props.contactToEdit.id : Date.now(),
      name: name(),
      surname: surname(),
      email: email(),
      phone: fullPhoneNumber,
      image: image(),
      notes: notes(),
      tags: tags().split(",").map(t => t.trim()).filter(Boolean),
      favourite: favourite(),
    }
    props.onAddContact(newContact)

    setName("")
    setSurname("")
    setEmail("")
    setEmailError("")
    setPhone("")
    setPhoneError("")
    setCountryCode("+1")
    setImage("")
    setNotes("")
    setTags("")
    setFavourite(false)

    ;(document.getElementById("add_modal") as HTMLDialogElement)?.close()
  }

  const handleDelete = () => {
    if (props.contactToEdit && props.onDeleteContact) {
      props.onDeleteContact(props.contactToEdit.id)
      ;(document.getElementById("add_modal") as HTMLDialogElement)?.close()
    }
  }

  return (
    <dialog class="modal" id="add_modal">
      <div class="modal-box">
        <form onSubmit={handleSubmit} class="p-4 card rounded-md ">
          <div class="grid grid-cols-2 w-full gap-3 items-end">
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
            <div class="form-control col-span-2">
              <label class="label" for="email">
                <span class="label-text">Email</span>
              </label>
              <input
                type="email"
                id="email"
                value={email()}
                onInput={handleEmailChange}
                class="input input-bordered w-full"
                required
              />
              {emailError() && (
                <span class="text-error text-sm">{emailError()}</span>
              )}
            </div>
            <div class="form-control col-span-2">
              <label class="label" for="phone">
                <span class="label-text">Phone</span>
              </label>
              <div class="flex gap-2">
                <select 
                  class="select select-bordered w-32" 
                  value={countryCode()} 
                  onChange={(e) => setCountryCode(e.currentTarget.value)}
                >
                  {countryCodes()?.map((country:any) => (
                    <option value={country.dial_code}>{country.name} ({country.dial_code})</option>
                  ))}
                </select>
                <input
                  type="tel"
                  id="phone"
                  value={phone()}
                  onInput={handlePhoneChange}
                  class="input input-bordered flex-1"
                  placeholder="Phone number"
                  required
                />
              </div>
              {phoneError() && (
                <span class="text-error text-sm">{phoneError()}</span>
              )}
            </div>
            <div class="form-control">
              <label class="label" for="image">
                <span class="label-text">Image (optional)</span>
              </label>
              <input
                type="file"
                id="image"
                onInput={handleImageChange}
                class="file-input file-input-bordered w-full max-w-xs"
                accept="image/*"
              />
            </div>
            {image() && (
              <img
                src={image()}
                alt="Contact"
                class="mt-2 w-14 h-14 object-cover rounded-full"
              />
            )}
            <div class="form-control">
              <label class="label" for="notes">
                <span class="label-text">Notes</span>
              </label>
              <textarea
                id="notes"
                value={notes()}
                onInput={e => setNotes(e.currentTarget.value)}
                class="textarea textarea-bordered w-full"
                rows={2}
              />
            </div>
            <div class="form-control">
              <label class="label" for="tags">
                <span class="label-text">Tags (comma separated)</span>
              </label>
              <input
                type="text"
                id="tags"
                value={tags()}
                onInput={e => setTags(e.currentTarget.value)}
                class="input input-bordered w-full"
              />
            </div>
            <div class="form-control flex-row items-center gap-2">
              <input
                type="checkbox"
                id="favourite"
                checked={favourite()}
                onInput={e => setFavourite(e.currentTarget.checked)}
                class="checkbox"
              />
              <label class="label" for="favourite">
                <span class="label-text">Favourite</span>
              </label>
            </div>
          </div>
          <div class="flex gap-4 mt-6">
            {props.contactToEdit && (
              <button
                type="button"
                class="btn btn-error flex-1"
                onClick={handleDelete}
              >
                Delete Contact
              </button>
            )}
            <button type="submit" class="btn btn-primary flex-1">
              {props.contactToEdit ? "Save Changes" : "Add Contact"}
            </button>
          </div>
        </form>
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
  )
}

export default AddContact
