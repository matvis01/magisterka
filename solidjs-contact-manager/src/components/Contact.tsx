type ContactProps = {
  name: string;
  surname: string;
  email: string;
  phone: string;
  image?: string;
};

export default function Contact(props: ContactProps) {
  const { name, surname, email, phone, image } = props;
  return (
    <div class="card card-compact bg-base-100 w-96 shadow-xl">
      <div class="card-body">
        <div class="flex items-center gap-5">
          <img
            src={image || "https://i.pravatar.cc/300"}
            alt="contact"
            class="rounded-full w-16 h-16"
          />
          <div>
            <h2 class="text-lg font-bold">
              {name} {surname}
            </h2>

            <p class="text-sm text-gray-500">{email}</p>

            <p class="text-sm text-gray-500">{phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
