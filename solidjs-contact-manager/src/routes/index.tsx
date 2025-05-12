import { createSignal, createMemo, For, Show } from 'solid-js';
import Contact from '../components/Contact';
import testContacts from '../data/testContacts.json';
import AddContact from '~/components/AddContact';

type ContactType = {
  id: number;
  name: string;
  surname: string;
  email: string;
  phone: string;
  image: string;
  notes?: string;
  tags?: string[];
  favorite?: boolean;
};

export default function Home() {
  const [searchVal, setSearchVal] = createSignal('');
  const [allContacts, setAllContacts] =
    createSignal<ContactType[]>(testContacts);
  const [contactToEdit, setContactToEdit] = createSignal<
    ContactType | undefined
  >(undefined);

  const [sortBy, setSortBy] = createSignal<'name' | 'surname' | 'recent'>(
    'name'
  );
  const [showFavorites, setShowFavorites] = createSignal(false);
  const [selectedTag, setSelectedTag] = createSignal<string | null>(null);
  const [currentPage, setCurrentPage] = createSignal(1);
  const pageSize = 20;

  function getAllTags() {
    const tags = new Set<string>();
    allContacts().forEach((c) => (c.tags || []).forEach((t) => tags.add(t)));
    return Array.from(tags);
  }

  const filteredContacts = createMemo(() => {
    let list = allContacts();
    if (showFavorites()) list = list.filter((c) => c.favorite);
    if (selectedTag())
      list = list.filter((c) => (c.tags || []).includes(selectedTag()!));
    if (searchVal()) {
      const allValues = searchVal().split(' ');
      for (const val of allValues) {
        list = list.filter(
          (contact) =>
            contact.name.toLowerCase().includes(val.toLowerCase()) ||
            contact.surname.toLowerCase().includes(val.toLowerCase()) ||
            contact.email.toLowerCase().includes(val.toLowerCase()) ||
            contact.phone.toLowerCase().includes(val.toLowerCase()) ||
            (contact.notes &&
              contact.notes.toLowerCase().includes(val.toLowerCase())) ||
            (contact.tags &&
              contact.tags.some((tag) =>
                tag.toLowerCase().includes(val.toLowerCase())
              ))
        );
      }
    }
    if (sortBy() === 'name')
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy() === 'surname')
      list = [...list].sort((a, b) => a.surname.localeCompare(b.surname));
    else if (sortBy() === 'recent')
      list = [...list].sort((a, b) => b.id - a.id);
    return list;
  });

  const paginatedContacts = createMemo(() => {
    const start = (currentPage() - 1) * pageSize;
    return filteredContacts().slice(start, start + pageSize);
  });

  const addOrUpdateContact = (contact: ContactType) => {
    if (contactToEdit()) {
      // Update existing contact
      setAllContacts(
        allContacts().map((c) => (c.id === contact.id ? contact : c))
      );
    } else {
      // Add new contact
      setAllContacts([...allContacts(), contact]);
    }
    filterContacts(searchVal());
    setContactToEdit(undefined); // Reset after adding/updating
  };

  function filterContacts(value: string) {
    setSearchVal(value);
    setCurrentPage(1); // Reset to first page when searching
    // The actual filtering is now handled by the filteredContacts memo
  }

  const deleteContact = (id: number) => {
    setAllContacts(allContacts().filter((contact) => contact.id !== id));
    filterContacts(searchVal());
  };

  function togglefavorite(id: number) {
    setAllContacts(
      allContacts().map((c) =>
        c.id === id ? { ...c, favorite: !c.favorite } : c
      )
    );
  }

  function handleExport() {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(allContacts(), null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'contacts.json');
    dlAnchor.click();
  }

  function handleImport(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target?.result as string);
          if (Array.isArray(imported)) setAllContacts(imported);
        } catch {}
      };
      reader.readAsText(input.files[0]);
    }
  }

  function validateEmail(email: string) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  }
  function validatePhone(phone: string) {
    return /^\+?\d{7,15}$/.test(phone.replace(/\s/g, ''));
  }

  return (
    <main class='w-full h-full flex justify-center text-base-content '>
      <div class='w-full max-w-screen-xl flex flex-col items-start gap-10 p-2 md:p-10'>
        <div class='w-full flex justify-between items-center'>
          <h1 class='text text-4xl font-bold'>Contacts</h1>
          <div class='dropdown dropdown-end'>
            <label tabindex='0' class='btn btn-ghost btn-sm'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                stroke-width='1.5'
                stroke='currentColor'
                class='w-6 h-6'
              >
                <path
                  stroke-linecap='round'
                  stroke-linejoin='round'
                  d='M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z'
                />
              </svg>
            </label>
            <ul
              tabindex='0'
              class='dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52'
            >
              <li>
                <button onClick={handleExport}>Export Contacts (JSON)</button>
              </li>
              <li>
                <label class='w-full'>
                  Import Contacts (JSON)
                  <input
                    type='file'
                    accept='application/json'
                    class='hidden'
                    onInput={handleImport}
                  />
                </label>
              </li>
            </ul>
          </div>
        </div>
        <div class='flex flex-col md:flex-row w-full gap-2'>
          <input
            class='input input-primary input-bordered w-full lg:w-1/2 xl:w-96'
            type='text'
            placeholder='Search (name, surname, email, phone, notes, tags)'
            value={searchVal()}
            onInput={(e) => filterContacts(e.currentTarget.value)}
          />
          <button
            class='btn btn-primary w-fit'
            onClick={() => {
              setContactToEdit(undefined);
              (
                document.getElementById('add_modal') as HTMLDialogElement
              )?.showModal();
            }}
          >
            Add Contact
          </button>
        </div>
        <div class='flex gap-3 flex-wrap items-center'>
          
          <select
            class='select select-bordered border-white'
            value={sortBy()}
            onInput={(e) => setSortBy(e.currentTarget.value as any)}
          >
            <option value='name'>Sort by Name</option>
            <option value='surname'>Sort by Surname</option>
            <option value='recent'>Sort by Recently Added</option>
          </select>
          <select
            class='select select-bordered border-white'
            value={selectedTag() || ''}
            onInput={(e) => setSelectedTag(e.currentTarget.value || null)}
          >
            <option value=''>All Tags</option>
            <For each={getAllTags()}>
              {(tag) => <option value={tag}>{tag}</option>}
            </For>
          </select>
          <button
            class='btn btn-outline'
            onClick={() => setShowFavorites((f) => !f)}
          >
            {showFavorites() ? 'Show All' : 'Show favorites'}
          </button>
        </div>

        {/* Add Contact Modal */}
        <AddContact
          onAddContact={addOrUpdateContact}
          contactToEdit={contactToEdit()}
          onDeleteContact={deleteContact}
        />

        <div class='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 w-full justify-items-center items-center'>
          <For each={paginatedContacts()}>
            {(contact) => (
              <Contact
                {...contact}
                edit={() => {
                  setContactToEdit(contact);
                  (
                    document.getElementById('add_modal') as HTMLDialogElement
                  )?.showModal();
                }}
              >
                <button
                  class='btn btn-ghost btn-sm'
                  onClick={() => togglefavorite(contact.id)}
                  title={
                    contact.favorite
                      ? 'Remove from favorites'
                      : 'Add to favorites'
                  }
                >
                  <span class={contact.favorite ? 'text-yellow-400' : ''}>
                    {contact.favorite ? '★' : '☆'}
                  </span>
                </button>
              </Contact>
            )}
          </For>
        </div>
        <div class='flex justify-center w-full mt-6'>
          <div class='join'>
            {/* Previous page button */}
            <button
              class='join-item btn'
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage() === 1}
            >
              «
            </button>

            {/* Page number buttons */}
            <For
              each={Array.from(
                {
                  length: Math.min(
                    5,
                    Math.ceil(filteredContacts().length / pageSize)
                  ),
                },
                (_, i) => {
                  const totalPages = Math.ceil(
                    filteredContacts().length / pageSize
                  );
                  const currentP = currentPage();

                  // Handle case with 5 or fewer total pages
                  if (totalPages <= 5) return i + 1;

                  // Handle first 3 pages
                  if (currentP <= 3) return i + 1;

                  // Handle last 3 pages
                  if (currentP >= totalPages - 2) return totalPages - 4 + i;

                  // Handle middle pages
                  return currentP - 2 + i;
                }
              )}
            >
              {(page) => (
                <button
                  class={`join-item btn ${
                    currentPage() === page ? 'btn-active' : ''
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              )}
            </For>

            {/* Next page button */}
            <button
              class='join-item btn'
              onClick={() =>
                setCurrentPage((p) =>
                  Math.min(
                    Math.ceil(filteredContacts().length / pageSize),
                    p + 1
                  )
                )
              }
              disabled={
                currentPage() >= Math.ceil(filteredContacts().length / pageSize)
              }
            >
              »
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
