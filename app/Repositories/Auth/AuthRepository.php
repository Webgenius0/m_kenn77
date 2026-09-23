<?php

namespace App\Repositories\Auth;

use App\Models\User;
use App\Models\TempUser;

class AuthRepository
{
    // public function createUser(array $data): User
    // {
    //     return User::create($data);
    // }

    public function createTempUser(array $data): TempUser
    {
        return TempUser::create($data);
    }

    public function TempUserByEmail(string $email): ?TempUser
    {
        return TempUser::where('email', $email)->first();
    }

    public function DeleteTempUser(string $email): void
    {
        TempUser::where('email', $email)->delete();
    }

    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }
}
