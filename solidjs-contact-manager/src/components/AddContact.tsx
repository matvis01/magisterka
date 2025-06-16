import { createSignal, createEffect } from "solid-js"
import countryCodes from "../data/CountryCodes.json"

function validateEmail(email: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
}

function validatePhone(phone: string) {
  return /^\+?\d{7,15}$/.test(phone.replace(/\s/g, ''))
}

interface Contact {
  id: number
  name: string
  surname: string
  email: string
  phone: string
  image: string
  notes?: string
  tags?: string[]
  favorite?: boolean
}

interface AddContactProps {
  onAddContact: (contact: Contact) => void
  onDeleteContact?: (id: number) => void
  contactToEdit?: Contact
  isOpen: boolean
  onClose: () => void
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
  const [favorite, setFavorite] = createSignal(false)

  createEffect(() => {
    if (props.contactToEdit) {
      setName(props.contactToEdit.name)
      setSurname(props.contactToEdit.surname)
      setEmail(props.contactToEdit.email)
      
      const phoneNumber = props.contactToEdit.phone;
      const countryCodeMatch = phoneNumber.match(/^\+\d+/);
      if (countryCodeMatch && countryCodes?.some((c:any) => c.dial_code === countryCodeMatch[0])) {
        setCountryCode(countryCodeMatch[0]);
        setPhone(phoneNumber.substring(countryCodeMatch[0].length).trim());
      } else {
        setCountryCode("+1");
        setPhone(phoneNumber);
      }
      
      setImage(props.contactToEdit.image)
      setNotes(props.contactToEdit.notes || "")
      setTags((props.contactToEdit.tags || []).join(", "))
      setFavorite(!!props.contactToEdit.favorite)
    } else {
      setName("")
      setSurname("")
      setEmail("")
      setCountryCode("+1")
      setPhone("")
      setImage("")
      setNotes("")
      setTags("")
      setFavorite(false)
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
      favorite: favorite(),    }
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
    setFavorite(false)

    props.onClose()
  }
  const handleDelete = () => {
    if (props.contactToEdit && props.onDeleteContact) {
      props.onDeleteContact(props.contactToEdit.id)
      props.onClose()
    }
  }

  return (
    <div class={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${props.isOpen ? '' : 'hidden'}`}>
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto relative">
        <form onSubmit={handleSubmit} class="p-6">
          <div class="grid grid-cols-2 w-full gap-4 items-end">
            <div class="flex flex-col">
              <label class="text-sm font-medium text-gray-700 mb-1" for="name">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name()}
                onInput={(e) => setName(e.currentTarget.value)}
                class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>
            <div class="flex flex-col">
              <label class="text-sm font-medium text-gray-700 mb-1" for="surname">
                Surname
              </label>
              <input
                type="text"
                id="surname"
                value={surname()}
                onInput={(e) => setSurname(e.currentTarget.value)}
                class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>
            <div class="flex flex-col col-span-2">
              <label class="text-sm font-medium text-gray-700 mb-1" for="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email()}
                onInput={handleEmailChange}
                class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
              {emailError() && (
                <span class="text-red-600 text-sm mt-1">{emailError()}</span>
              )}
            </div>            <div class="flex flex-col col-span-2">
              <label class="text-sm font-medium text-gray-700 mb-1" for="phone">
                Phone
              </label>
              <div class="flex gap-2">
                <select 
                  class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white w-24" 
                  value={countryCode()} 
                  onChange={(e) => setCountryCode(e.currentTarget.value)}
                >
                  <option disabled selected hidden>{countryCode()}</option>
                  {countryCodes?.map((country:any) => (
                    <option value={country.dial_code}>{country.name} ({country.dial_code})</option>
                  ))}
                </select>
                <input
                  type="tel"
                  id="phone"
                  value={phone()}
                  onInput={handlePhoneChange}
                  class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none flex-1"
                  placeholder="Phone number"
                  required
                />
              </div>
              {phoneError() && (
                <span class="text-red-600 text-sm mt-1">{phoneError()}</span>
              )}
            </div>            <div class="flex flex-col">
              <label class="text-sm font-medium text-gray-700 mb-1" for="image">
                Image (optional)
              </label>
              <input
                type="file"
                id="image"
                onInput={handleImageChange}
                class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                accept="image/*"
              />
            </div>
            {image() && (
              <img
                src={image()}
                alt="Contact"
                class="mt-2 w-14 h-14 object-cover rounded-full border-2 border-gray-200"
              />
            )}
            <div class="flex flex-col">
              <label class="text-sm font-medium text-gray-700 mb-1" for="notes">
                Notes
              </label>
              <textarea
                id="notes"
                value={notes()}
                onInput={e => setNotes(e.currentTarget.value)}
                class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                rows={2}
              />
            </div>
            <div class="flex flex-col">
              <label class="text-sm font-medium text-gray-700 mb-1" for="tags">
                Tags (comma separated)
              </label>
              <input
                type="text"
                id="tags"
                value={tags()}
                onInput={e => setTags(e.currentTarget.value)}
                class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                id="favorite"
                checked={favorite()}
                onInput={e => setFavorite(e.currentTarget.checked)}
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label class="text-sm font-medium text-gray-700" for="favorite">
                Favorite
              </label>
            </div>          </div>
          <div class="flex gap-4 mt-6">
            {props.contactToEdit && (
              <button
                type="button"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors flex-1"
                onClick={handleDelete}
              >
                Delete Contact
              </button>
            )}
            <button 
              type="submit" 
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex-1"
            >
              {props.contactToEdit ? "Save Changes" : "Add Contact"}
            </button>
          </div>
        </form>        <button
          type="button"
          class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          onClick={props.onClose}
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default AddContact
