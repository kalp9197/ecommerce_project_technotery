import React from "react";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-6">Welcome to ShopApp</h1>
          <p className="text-muted-foreground">
            A simple e-commerce application demo with mock authentication
          </p>
        </div>

        <div className="bg-card p-8 rounded-lg shadow-sm border">
          <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
          <p className="text-muted-foreground mb-6">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Nisi quis
            unde delectus vel. Repudiandae, nobis. Ad eaque deleniti enim totam
            eos voluptatem ipsam perspiciatis excepturi, labore quas corrupti a
            nam?
          </p>
        </div>
      </div>
    </div>
  );
}
