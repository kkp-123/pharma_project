import { useEffect, useState } from "react";
import api from "../../services/api";

const MyBonus = () => {

  const [bonus, setBonus] = useState([]);

  useEffect(() => {
    fetchBonus();
  }, []);

  const fetchBonus = async () => {

    try {
      const { data } = await api.get("/bonus/my");
      setBonus(data?.bonus || (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error(err);
      setBonus([]);
    }

  };

  return (

    <div className="p-6 bg-slate-900 min-h-screen text-white">

      <h1 className="text-2xl font-bold mb-6">
        My Bonus
      </h1>

      <div className="grid gap-4">

        {bonus.map(b => (

          <div
            key={b._id}
            className="bg-slate-800 p-4 rounded-xl"
          >

            <div className="flex justify-between">

              <div>

                <p>
                  Month : {b.month}
                </p>

                <p>
                  Amount : ₹ {b.amount}
                </p>

              </div>

              <div>

                {b.isPaid ? (

                  <span className="text-green-400">
                    Paid
                  </span>

                ) : (

                  <span className="text-yellow-400">
                    Pending
                  </span>

                )}

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>

  );

};

export default MyBonus;