type ContactProps = {
  id: number;
  name: string;
  surname: string;
  email: string;
  phone: string;
  image?: string;
};

export default function Contact(props: ContactProps) {
  const { name, surname, email, phone, image } = props;
  return (
    <div class="card card-compact bg-neutral w-full shadow-xl text-neutral-content">
      <div class="card-body">
        <div class="flex items-center gap-5">
          <img
            src={image || "https://i.pravatar.cc/300"}
            alt="contact"
            class="rounded-full w-16 h-16"
          />
          <div>
            <h2 class="text-lg font-bold ">
              {name} {surname}
            </h2>

            <p class="text-sm ">{email}</p>

            <p class="text-sm ">{phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
